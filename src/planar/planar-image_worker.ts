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

import { PlanarTargetWasmModule } from '../../defs/planar-target.js';
import { DEBUG_LEVEL, enableLogLevel, log } from '../utils/logger.js';
import { PlanarTargetDetector } from './planar-detector.js';

declare global {
  function importScripts(...urls: string[]): void;
  function ModuleFactory(seed: {}): PlanarTargetWasmModule;
}

enableLogLevel(DEBUG_LEVEL.VERBOSE);

const START_INDEX = 1000;
let addCount = START_INDEX;
let detector: PlanarTargetDetector;
self.onmessage = (e: MessageEvent) => {
  // Initializing.
  if (typeof e.data === 'string') {
    const pathPrefix = e.data;
    if ('importScripts' in self) {
      // Import the emscripten'd file that loads the wasm.
      importScripts(`${pathPrefix}/lib/planar/planar-target-detector.js`);

      const moduleSeed = {
        locateFile(url: string) {
          if (url.endsWith('.wasm')) {
            return `${pathPrefix}/third_party/planar-image/${url}`;
          }

          return url;
        },

        onRuntimeInitialized() {
          // Run a fake image here to boot the graph.
          detector.process(new ImageData(1, 1), Date.now());
          (self as any).postMessage('ready');
        }
      };

      // Create the Module var first before instantiating the detector.
      (self as any).Module = ModuleFactory(moduleSeed);
      detector = new PlanarTargetDetector();
    }
    return;
  }

  const host = (self as any);
  const { type, data, id, msgId } = e.data;

  switch (type) {
    // Process image data.
    case 'process':
      try {
        const processResult = detector.process(data, Date.now());
        const detections: number[] = [];
        for (let r = 0; r < processResult.size(); r++) {
          detections.push(processResult.get(r).id);
        }

        host.postMessage({ msgId, data: detections });
      } catch (e) {
        log(e.message, DEBUG_LEVEL.ERROR);
        host.postMessage({ msgId, data: [] });
      }
      break;

    // Add a target.
    case 'add':
      detector.addDetectionWithId(addCount, data);
      host.postMessage({ msgId, data: { idx: addCount, id } });
      addCount++;
      break;

    // Remove a target.
    case 'remove':
      detector.cancelDetection(data);
      host.postMessage({ msgId, data });
      break;

    case 'reset':
      // Currently resetting doesn't do anything on this side, but it may do so
      // this can act as a placeholder for the time being.
      addCount = START_INDEX;
      host.postMessage({ msgId });
      break;
  }
};
