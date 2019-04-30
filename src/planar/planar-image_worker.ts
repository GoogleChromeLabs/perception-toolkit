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
import { PlanarTargetDetector } from './planar-detector.js';

declare global {
  function importScripts(...urls: string[]): void;
  function ModuleFactory(seed: {}): PlanarTargetWasmModule;
}

let addCount = 1010;
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
  const { type, data } = e.data;

  switch (type) {
    // Process image data.
    case 'process':
      const processResult = detector.process(data, Date.now());
      const detections: number[] = [];
      for (let r = 0; r < processResult.size(); r++) {
        detections.push(processResult.get(r).id);
      }

      host.postMessage(detections);
      break;

    // Add a target.
    case 'add':
      detector.addDetectionWithId(addCount, data);
      host.postMessage(addCount);
      addCount++;
      break;

    case 'remove':
      detector.cancelDetection(data);
      host.postMessage();
      break;
  }
};
