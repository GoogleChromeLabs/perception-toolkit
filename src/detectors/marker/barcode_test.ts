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
import { createStubInstance, spy } from 'sinon';
import { BarcodeDetectorPolyfill } from '../../polyfill/barcode-detector.js';
import { detectBarcodes } from './barcode.js';

describe('BarcodeDetector', () => {

  class BarcodeDetectorMock {
    detect() {
      return Promise.resolve([]);
    }
  }

  function createSpy({throws = false} = {}) {
    const stub = spy(() => {
      const instance = createStubInstance(BarcodeDetectorMock);

      if (throws) {
        instance.detect.throws(new Error('Mock error'));
      } else {
        instance.detect.returns(Promise.resolve([{rawValue: 'foo', format: 'qr_code'}]));
      }

      return instance;
    });

    return {
      BarcodeDetector: stub
    };
  }

  it('should detect', async () => {
    const barcodeSpy = createSpy();
    const canvas = document.createElement('canvas');
    const barcodes = await detectBarcodes(canvas, {
        context: barcodeSpy as any, forceNewDetector: true
    });

    assert.deepEqual(barcodes, [{value: 'foo', type: 'qr_code'}]);
    assert(barcodeSpy.BarcodeDetector.called);
  });

  it('recovers from failed detection', async () => {
    const barcodeSpy = createSpy({throws: true});
    const canvas = document.createElement('canvas');
    const barcodes = await detectBarcodes(canvas, {
      context: barcodeSpy as any, forceNewDetector: true
    });

    assert.deepEqual(barcodes, []);
    assert(barcodeSpy.BarcodeDetector.called);
  }).timeout(5000);

  it('recovers from secondary failed detection', async () => {
    // Try and remove the polyfill.
    const win: Window & {BarcodeDetector?: BarcodeDetectorPolyfill} =
        window as any;
    const Detector = win.BarcodeDetector;
    if (typeof Detector !== 'undefined') {
      // Detector, but possible polyfill.
      if ((Detector as any).name === 'BarcodeDetectorPolyfill') {
        delete (window as any).BarcodeDetector;
      } else {
        // Leave here - the browser supports the feature.
        return;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 100;
    const barcodes = await detectBarcodes(canvas, { forceNewDetector: true });

    assert.deepEqual(barcodes, []);
  }).timeout(5000);
});
