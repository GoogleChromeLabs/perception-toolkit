
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DetectableImage, DetectedImage } from '../../../defs/detected-image.js';
import { Marker } from '../../../defs/marker.js';
import { DEBUG_LEVEL, log } from '../../utils/logger.js';

class Detector {
  private readonly targets = new Map<number, DetectedImage>();
  private isReadyInternal: Promise<void>;
  private worker!: Worker;
  private workerMessageCallbacks = new Map<string, (data: any) => void>();

  constructor(root = '') {
    this.isReadyInternal = new Promise((resolve) => {
      this.worker = new Worker(`${root}/lib/planar/planar-image_worker.js`);
      this.worker.onmessage = async (e) => {
        /* istanbul ignore if */
        if (e.data === 'ready') {
          resolve();
          return;
        }

        const { msgId, data } = e.data;
        log(`Message (id: ${msgId}) from worker.`, DEBUG_LEVEL.VERBOSE);
        const callback = this.workerMessageCallbacks.get(msgId);
        if (!callback) {
          return;
        }

        this.workerMessageCallbacks.delete(msgId);
        callback.apply(undefined, [data]);
      };

      this.worker.postMessage(root);

      // Attempt to prevent worker GC.
      (window as any).planarWorker = this.worker;
    });
  }

  get isReady() {
    return this.isReadyInternal;
  }

  detect(data: ImageData): Promise<Marker[]> {
    if (this.targets.size === 0) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      const startTime = performance.now();
      this.send({ type: 'process', data }, (processData: null | number[]) => {
        /* istanbul ignore if */
        if (processData === null) {
          return [];
        }

        const matches = processData as number[];

        // Remap to actual target values and filter out empties.
        const ids = matches.map((id) => {
          const target = this.targets.get(id);
          /* istanbul ignore if */
          if (!target) {
            return { value: null };
          }

          return {
            type: 'ARImageTarget',
            value: target.id,
          };
        }).filter(value => !!value.value) as Marker[];

        resolve(ids);
        log(`Time taken (ms): ${performance.now() - startTime} ` +
            `for ${data.width} * ${data.height}`, DEBUG_LEVEL.VERBOSE);
      });
    });
  }

  getTarget(id: string) {
    for (const target of this.targets.values()) {
      if (target.id === id) {
        return target;
      }
    }
  }

  addTarget(data: Uint8Array, image: DetectableImage): Promise<number> {
    return new Promise((resolve) => {
      this.send({ type: 'add', data, id: image.id }, (addData: {idx: number, id: string}) => {
        const { idx, id } = addData;
        this.targets.set(idx as number, { id });
        log(`Target stored: ${id}, number ${idx}`, DEBUG_LEVEL.VERBOSE);
        resolve(idx);
      });
    });
  }

  removeTarget(data: number): Promise<void> {
    return new Promise((resolve) => {
      this.send({ type: 'remove', data }, (removeData: number) => {
        this.targets.delete(removeData);
        log(`Target removed: number ${data}`, DEBUG_LEVEL.VERBOSE);
        resolve();
      });
    });
  }

  async clear() {
    for (const id of this.targets.keys()) {
      await this.removeTarget(id);
    }

    this.targets.clear();
    return new Promise((resolve) => {
      this.send({ type: 'reset' }, () => {
        log(`Image detector reset`, DEBUG_LEVEL.VERBOSE);
        resolve();
      });
    });
  }

  private send(msg: { type: string, data?: any, id?: string }, callback: (data: any) => void) {
    const makeRandId = () => {
      // Array of zeros.
      return new Array(16).fill(0)
          // Remapped to random alphanumeric values.
          .map(() => String.fromCharCode(97 + (Math.random() * 26) | 0))
          // Joined together.
          .join('');
    };

    const msgId = makeRandId();
    log(`Message (id: ${msgId}, type: ${msg.type}) to worker.`, DEBUG_LEVEL.VERBOSE);
    this.workerMessageCallbacks.set(msgId, callback);
    this.worker.postMessage({...msg, msgId});
  }
}

let detector: Detector;
export async function detectPlanarImages(data: ImageData, {root = ''} = {}) {
  /* istanbul ignore if */
  if (!detector) {
    detector = new Detector(root);
  }

  await detector.isReady;
  return detector.detect(data);
}

export async function addDetectionTarget(data: Uint8Array,
                                         image: DetectableImage,
                                         {root = ''} = {}): Promise<number> {
  /* istanbul ignore if */
  if (!detector) {
    detector = new Detector(root);
  }

  await detector.isReady;
  return detector.addTarget(data, image);
}

export async function removeDetectionTarget(id: number,
                                            {root = ''} = {}): Promise<void> {
  /* istanbul ignore if */
  if (!detector) {
    detector = new Detector(root);
  }

  await detector.isReady;
  return detector.removeTarget(id);
}

export async function getTarget(id: string,
                                {root = ''} = {}) {
  /* istanbul ignore if */
  if (!detector) {
    detector = new Detector(root);
  }

  await detector.isReady;
  return detector.getTarget(id);
}

export async function reset() {
  /* istanbul ignore if */
  if (!detector) {
    return;
  }

  return detector.clear();
}
