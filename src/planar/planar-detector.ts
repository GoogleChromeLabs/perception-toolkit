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

/**
 * @fileoverview PlanarTargetDetector takes in image frame data and outputs
 * the results from the wasm-run Drishti detection graph.
 */

declare global {
  const Module: any;
}

import { DEBUG_LEVEL, log } from '../utils/logger.js';
import { WasmHeapWriter } from './wasm-heap-writer.js';

/**
 * A class for processing image frames and returning any planar target
 * detections.
 */
export class PlanarTargetDetector {
  private pixelsPtr: number | null;
  private pixelsSize: number;
  private hasLoaded = false;

  constructor() {
    this.pixelsPtr = null;
    this.pixelsSize = 0;

    Module.preRun.push(() => {
      this.hasLoaded = true;
    });
  }

  // Bindings into C++

  /**
   * Takes the relevant information from the JS image frame and hands it off
   * to C++ for processing to determine planar target detections.
   * @param {!ImageData} imageData The raw image data for the current frame.
   * @param {number} timestamp The timestamp of the current frame, in ms.
   * @return {!QuadVec} embind-created structure holding a vector of
   *     {!QuadDetection} objects. Structure is autogenerated from
   *     planar_target_detector_internal.cc, so please see there for more info.
   */
  process(imageData: ImageData, timestamp: number) {
    if (!this.hasLoaded) {
      return null;
    }
    const width = imageData.width;
    const height = imageData.height;

    // (Re-)allocate image memory space if needed.
    const size = 4 * width * height;
    if (this.pixelsSize !== size) {
      if (this.pixelsPtr) {
        Module._free(this.pixelsPtr);
      }
      this.pixelsPtr = Module._malloc(size);
      this.pixelsSize = size;
    }
    Module.HEAPU8.set(imageData.data, this.pixelsPtr);

    if (!this.pixelsPtr) {
      throw new Error('Unable to reserve pixel pointer with malloc');
    }

    const wasmHeapWriterByteCount = 24;  // 4 ints and 1 ll (timestamp)
    const frameDataWriter = new WasmHeapWriter(wasmHeapWriterByteCount);
    // Order matters here, and must follow the C++ layout in FrameData struct.
    // We add one more int here for proper padding for timestamp.
    frameDataWriter.writeInt32(0);  // padding.
    frameDataWriter.writeInt32(width);
    frameDataWriter.writeInt32(height);
    frameDataWriter.writePtr(this.pixelsPtr);
    frameDataWriter.writeFloat64(timestamp);

    const frameDataPtr = frameDataWriter.getData();

    // We use embind version so we can tap more easily into std::vector
    const outputVec = Module.process(frameDataPtr);
    Module._free(frameDataPtr);
    return outputVec;
  }

  /**
   * Takes a Uint8Array containing the raw byte data of a BoxDetectorIndex file
   * representing a single planar target, as well as the unique identifier to
   * use for this planar target when detecting. Will set the objectId as
   * specified, copy over the data to the shared heap for C++-side WASM
   * processing, and add it to the set of objects to detect. The unique
   * identifier should not currently be in use, and the BoxDetectorIndex data
   * must represent *only one* planar target. Whatever object identifier was
   * previously encoded into the BoxDetectorIndex data will be overwritten by
   * the new objectId.
   * @param {number} objectId The unique (non-negative) identifier to use for
   *     this object during detection. Must not be currently in use.
   * @param {!Uint8Array} detectorIndexData The array of raw byte data for a
   *     BoxDetectorIndex file, which can be generated offline using the
   *     Planar Target Indexer utility.
   */
  addDetectionWithId(objectId: number, detectorIndexData: Uint8Array) {
    if (!this.hasLoaded) {
      log('Cannot add detection until detection has started.', DEBUG_LEVEL.ERROR);
      return;
    }
    const size = detectorIndexData.length;
    const indexPtr = Module._malloc(size);

    Module.HEAPU8.set(detectorIndexData, indexPtr);
    Module._addObjectIndexWithId(objectId, size, indexPtr);
    Module._free(indexPtr);
  }

  /**
   * Takes a Uint8Array containing the raw byte data of a BoxDetectorIndex file
   * representing an arbitrary number of planar targets, and copies it to the
   * shared heap for C++-side WASM processing, adding all targets to the set of
   * objects to detect. The unique identifiers for these objects should be
   * already built into the BoxDetectorIndex file.
   * @param {!Uint8Array} detectorIndexData The array of raw byte data for a
   *     BoxDetectorIndex file, which can be generated offline using the Planar
   *     Target Indexer utility.
   */
  addDetection(detectorIndexData: Uint8Array) {
    // -1 is a special invalid identifier for processing all planar targets from
    // file data without editing.
    this.addDetectionWithId(-1, detectorIndexData);
  }

  /**
   * Takes the id of an object we currently try to detect, and removes it from
   * our dictionary of detection objects, thereby cancelling detection on it.
   * @param {number} objectId The unique identifier of the object to stop
   *     detecting.
   */
  cancelDetection(objectId: number) {
    if (!this.hasLoaded) {
      log('Cannot cancel detection until detection has started.', DEBUG_LEVEL.ERROR);
      return;
    }
    Module._cancelObjectId(objectId);
  }
}
