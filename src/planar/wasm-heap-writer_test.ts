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

const { assert } = chai;

import { WasmHeapWriter } from './wasm-heap-writer.js';

declare global {
  interface Window {
    Module: {
      HEAPU8: Uint8Array;
      HEAPU32: Uint32Array;
      HEAPF32: Float32Array;
      HEAPF64: Float64Array;
      _malloc(size: number): void;
    };
  }
}

let memory: ArrayBuffer;
class Module {
  constructor(public invalidMalloc = false, public mallocOffset = 0) {}

  _malloc(size: number) {
    if (this.invalidMalloc) {
      return null;
    }

    memory = new ArrayBuffer(this.mallocOffset + size);
    return this.mallocOffset;
  }

  get HEAPU8() {
    return new Uint8Array(memory);
  }

  get HEAPU32() {
    return new Uint32Array(memory);
  }

  get HEAPF32() {
    return new Float32Array(memory);
  }

  get HEAPF64() {
    return new Float64Array(memory);
  }
}

describe('WasmHeapWriter', () => {
  beforeEach(() => {
    window.Module = new Module();
  });

  it('reserves the correct space', () => {
    const writer = new WasmHeapWriter(32);
    assert.equal(memory.byteLength, 32);
  });

  it('throws for bad reservations', () => {
    window.Module = new Module(true);
    assert.throws(() => new WasmHeapWriter(-1));
  });

  it('snaps to words', () => {
    const writer = new WasmHeapWriter(8);
    writer.snapToWordAlignment();
    writer.writeBool(true);
    writer.snapToWordAlignment();
    writer.writeBool(true);

    const expected = Uint8Array.from([1, 0, 0, 0, 1, 0, 0, 0]);
    assert.deepEqual(new Uint8Array(memory), expected);
  });

  it('snaps to double words', () => {
    const writer = new WasmHeapWriter(16);
    writer.snapToDoubleWordAlignment();
    writer.writeBool(true);
    writer.snapToDoubleWordAlignment();
    writer.writeBool(true);

    const expected = Uint8Array.from([
      1, 0, 0, 0, 0, 0, 0, 0,
      1, 0, 0, 0, 0, 0, 0, 0
    ]);
    assert.deepEqual(new Uint8Array(memory), expected);
  });

  it('writes bools', () => {
    const writer = new WasmHeapWriter(8);
    writer.writeBool(true);
    writer.writeBool(false);
    writer.writeBool(1);
    writer.writeBool(0);

    const expected = Uint8Array.from([
      1, 0, 1, 0, 0, 0, 0, 0
    ]);
    assert.deepEqual(new Uint8Array(memory), expected);
  });

  it('writes int32', () => {
    const writer = new WasmHeapWriter(8);

    // Drop a 1 in each int32 byte's slot, such that
    // if requested back as a Uint8Array we should see 1, 1, 1, 1.
    const value = (1 << 24 | 1 << 16 | 1 << 8 | 1);
    writer.writeInt32(value);

    const expected = Uint8Array.from([
      1, 1, 1, 1, 0, 0, 0, 0
    ]);
    assert.deepEqual(new Uint8Array(memory), expected);
  });

  it('snaps int32s', () => {
    const writer = new WasmHeapWriter(8);

    // Write a bool so that the expectation is that it should
    // move to the next 4 bytes for the subsequent write.
    writer.writeBool(1);

    // Drop a 1 in each int32 byte's slot, such that
    // if requested back as a Uint8Array we should see 1, 1, 1, 1.
    const value = (1 << 24 | 1 << 16 | 1 << 8 | 1);
    writer.writeInt32(value);

    const expected = Uint8Array.from([
      1, 0, 0, 0, 1, 1, 1, 1
    ]);
    assert.deepEqual(new Uint8Array(memory), expected);
  });

  it('writes float64s', () => {
    const writer = new WasmHeapWriter(16);
    const value0 = 1 << 54;
    const value1 = 1 << 44;
    writer.writeFloat64(value0);
    writer.writeFloat64(value1);
    const memView = new Float64Array(memory);
    assert.equal(memView[0], value0);
    assert.equal(memView[1], value1);
  });

  it('snaps float64s', () => {
    const writer = new WasmHeapWriter(16);

    // Write a bool to force a snap.
    writer.writeBool(1);

    const value = 1 << 54;
    writer.writeFloat64(value);
    const memView = new Float64Array(memory);
    assert.equal(memView[1], value);
  });

  it('writes 32-bit pointers', () => {
    const writer = new WasmHeapWriter(8);

    // Drop a 1 in each int32 byte's slot, such that
    // if requested back as a Uint8Array we should see 1, 1, 1, 1.
    const value = (1 << 24 | 1 << 16 | 1 << 8 | 1);
    writer.writePtr(value);

    const expected = Uint8Array.from([
      1, 1, 1, 1, 0, 0, 0, 0
    ]);
    assert.deepEqual(new Uint8Array(memory), expected);
  });

  it('writes float32s', () => {
    const writer = new WasmHeapWriter(16);
    const value0 = 1 << 22;
    const value1 = 1 << 17;
    writer.writeFloat(value0);
    writer.writeFloat(value1);
    const memView = new Float32Array(memory);
    assert.equal(memView[0], value0);
    assert.equal(memView[1], value1);
  });

  it('snaps float32s', () => {
    const writer = new WasmHeapWriter(16);

    // Write a bool to force a snap.
    writer.writeBool(1);

    const value = 1 << 15;
    writer.writeFloat(value);
    const memView = new Float32Array(memory);
    assert.equal(memView[1], value);
  });

  it('offsets correctly', () => {
    const offset = 8;  // Start at 8 bytes in.
    window.Module = new Module(false, offset);
    const writer = new WasmHeapWriter(8);
    writer.writeBool(1);

    // Expect the pointer to be the offset.
    const ptr = writer.getData();
    assert.equal(ptr, offset);

    // Because of the byte offset, expect the boolean written
    // to be at the 9th byte.
    const expected = Uint8Array.from([
      0, 0, 0, 0, 0, 0, 0, 0,
      1, 0, 0, 0, 0, 0, 0, 0,
    ]);
    assert.deepEqual(new Uint8Array(memory), expected);
  });
});
