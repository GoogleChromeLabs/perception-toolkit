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

export class WasmHeapWriter {
  private ptr: number | null;
  private size: number;
  private uint8View: Uint8Array;
  private uint32View: Uint32Array;
  private float32View: Float32Array;
  private float64View: Float64Array;
  private offset: number;

  constructor(size: number) {
    this.ptr = Module._malloc(size);
    if (typeof this.ptr === 'undefined' || this.ptr === null) {
      throw new Error(`Malloc failed: size (${size})`);
    }

    this.size = size;
    this.uint8View =
        new Uint8Array(Module.HEAPU8.buffer, this.ptr, size);
    this.uint32View =
        new Uint32Array(Module.HEAPU32.buffer, this.ptr, size >> 2);
    this.float32View =
        new Float32Array(Module.HEAPF32.buffer, this.ptr, size >> 2);
    this.float64View =
        new Float64Array(Module.HEAPF64.buffer, this.ptr, size >> 3);
    this.offset = 0;
  }

  snapToWordAlignment() {
    const inWordOffset = this.offset % 4;
    if (inWordOffset === 0) {
      return;
    }
    this.offset += 4 - inWordOffset;
  }

  snapToDoubleWordAlignment() {
    const inWordOffset = this.offset % 8;
    if (inWordOffset === 0) {
      return;
    }
    this.offset += 8 - inWordOffset;
  }

  writeUint8(value: number) {
    this.uint8View[this.offset] = value;
    this.offset += 1;
  }

  writeBool(value: 1 | 0 | boolean) {
    /* istanbul ignore else */
    if (typeof value === 'boolean') {
      value = value ? 1 : 0;
    }
    this.writeUint8(value);
  }

  writeInt32(value: number) {
    this.snapToWordAlignment();
    this.uint32View[this.offset >> 2] = value;
    this.offset += 4;
  }

  writeFloat64(value: number) {
    this.snapToDoubleWordAlignment();
    this.float64View[this.offset >> 3] = value;
    this.offset += 8;
  }

  writePtr(value: number) {
    this.writeInt32(value);
  }

  writeFloat(value: number) {
    this.snapToWordAlignment();
    this.float32View[this.offset >> 2] = value;
    this.offset += 4;
  }

  // Caller takes ownership of the returned pointer.
  getData(warnOnByteMismatch = false) {
    this.snapToWordAlignment();
    const bytesWritten = this.offset;

    /* istanbul ignore next */
    if (warnOnByteMismatch && bytesWritten !== this.size) {
      console.error(
          'wrote ' + bytesWritten + ' bytes, but expected to write ' +
          this.size);
    }
    const ptr = this.ptr;
    this.ptr = null;
    return ptr;
  }
}
