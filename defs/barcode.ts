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

import { WasmModule } from './wasm-module.js';

export interface BarcodeDetector {
  isReady?: Promise<void>;
  detect(data: ImageData | ImageBitmap | HTMLCanvasElement):
      Promise<Array<{ rawValue: string, format: string }>>;
}

declare global {
  const BarcodeDetector: {
    prototype: BarcodeDetector;
    isReady?: Promise<void>;
    new(): BarcodeDetector;
  };
}

export interface BarcodeDectionResult {
  format: string;
  text: string;
  error: string;
}

export type BarcodeWasmModule = WasmModule & {
  readBarcodeFromPng(buffer: Uint8ClampedArray,
                     width: number,
                     height: number): BarcodeDectionResult
};
