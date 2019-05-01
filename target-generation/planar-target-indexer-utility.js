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

const WasmHeapWriter = require('./wasm-heap-writer.js');

/**
 * Utility class for compiling pairs of the form:
 * (unique integer identifier, image) into a binary dictionary blob for later
 * use with planar target detection.
 */
class PlanarTargetIndexer {
  constructor() {
    this.pixelsPtr_ = null;
    this.pixelsSize_ = 0;
  }

  disposePixelsPtr() {
    if (this.pixelsPtr_) {
      global.Module._free(this.pixelsPtr_);
    }
  }

  /**
   * Takes an ImageData and a unique integer identifier, and adds these
   * synchronously to the current index map.
   * @param {!ImageData} imageData The image data from a 2d canvas context.
   * @param {number} id The unique identifier to associate with this image data.
   */
  processImageFrame(imageData, id) {
    const {width, height} = imageData;
    const size = 4 * width * height;
    // Realloc if size has changed.
    if (this.pixelsSize_ !== size) {
      this.disposePixelsPtr();
      this.pixelsPtr_ = global.Module._malloc(size);
      this.pixelsSize_ = size;
    }
    global.Module.HEAPU8.set(imageData.data, this.pixelsPtr_);

    const imageFrameDataWriter = new WasmHeapWriter(16);
    imageFrameDataWriter.writeInt32(id);
    imageFrameDataWriter.writeInt32(width);
    imageFrameDataWriter.writeInt32(height);
    imageFrameDataWriter.writePtr(this.pixelsPtr_);
    const imageFramePtr = imageFrameDataWriter.getData();
    global.Module._processImage(imageFramePtr);
    global.Module._free(imageFramePtr);
  }

  /**
   * Synchronously finishes building and returns the constructed index map,
   * clearing the internal state in the process.
   */
  extractIndex() {
    // We deal with only uint32 offsets for now.
    const outputPtr = global.Module._extractIndex() / 4;
    const blobSize = global.Module.HEAPU32[outputPtr + 1];
    const blobPtr = global.Module.HEAPU32[outputPtr + 2];
    return {
      numEntries: global.Module.HEAPU32[outputPtr],
      blobSize: blobSize,
      blobData: new Uint8Array(global.Module.HEAPU8.buffer, blobPtr, blobSize),
    };
  }
}

module.exports = PlanarTargetIndexer;
