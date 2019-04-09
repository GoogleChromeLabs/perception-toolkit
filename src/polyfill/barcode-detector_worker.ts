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

declare global {
  function importScripts(...urls: string[]): void;
}

import { BarcodeWasmModule } from '../../defs/barcode.js';

function getDetectorModule() {
  return (self as any).Module as BarcodeWasmModule;
}

class WasmBarcodeDetector {
  process(data: ImageData) {
    const Module = getDetectorModule();
    const format = '';
    const fileData = data.data;
    const buffer = Module._malloc(fileData.length);
    Module.HEAPU8.set(fileData, buffer);
    const result =
        Module.readBarcodeFromPng(data.data, data.width, data.height);
    Module._free(buffer);

    if (result.text && result.format) {
      return [{rawValue: result.text, format: result.format.toLowerCase()}];
    }

    return [];
  }
}

const detector = new WasmBarcodeDetector();
self.onmessage = (e: MessageEvent) => {
  // Initializing.
  if (typeof e.data === 'string') {
    const pathPrefix = e.data;
    (self as any).Module = {
      locateFile(url: string) {
        if (url.endsWith('.wasm')) {
          return `${pathPrefix}third_party/zxing/${url}`;
        }

        return url;
      },

      onRuntimeInitialized() {
        (self as any).postMessage('ready');
      }
    } as BarcodeWasmModule;  // Cast as WasmModule because the import will augment.

    if ('importScripts' in self) {
      // Import the emscripten'd file that loads the wasm.
      importScripts(`${pathPrefix}third_party/zxing/zxing_reader.js`);
    }
    return;
  }

  const data = detector.process(e.data);
  (self as any).postMessage(data);
};
