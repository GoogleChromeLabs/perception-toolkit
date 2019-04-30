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

export interface PlanarQuad {
  id: number;
  x1: number;
  x2: number;
  x3: number;
  x4: number;
  y1: number;
  y2: number;
  y3: number;
  y4: number;
}

export interface PlanarTargetProcessResult {
  size(): number;
  get(idx: number): PlanarQuad;
}

interface PlanarTargetDetector {
  process(data: ImageData, timestamp: number): PlanarTargetProcessResult;
  addDetection(detectorIndexData: Uint8Array): void;
  cancelDetection(objectId: number): void;
}

declare global {
  const PlanarTargetDetector: {
    prototype: PlanarTargetDetector;
    new(): PlanarTargetDetector;
  };
}

export interface PlanarTargetDectionResult {
  format: string;
  text: string;
  error: string;
}

export type PlanarTargetWasmModule = WasmModule;
