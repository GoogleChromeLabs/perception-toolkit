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

import { BarcodeDetectorPolyfill } from './barcode-detector.js';

const workerValidSrc = `
  self.postMessage('ready');
  self.onmessage = (e) => {
    // Initialize.
    self.postMessage('ready');

    // Handle future messages.
    self.onmessage = (e) => {
      const value = [{rawValue: 'foo'}]
      self.postMessage(value);
    };
  }`;
const workerValidUrl = URL.createObjectURL(new Blob([workerValidSrc]));

describe('BarcodeDetector', () => {
  it('isReady', async () => {
    const BarcodeDetector = new BarcodeDetectorPolyfill(workerValidUrl);
    const ready = await BarcodeDetector.isReady;
    assert.isTrue(ready);
  });

  it('fails for invalid workers', async () => {
    try {
      const workerSrc = `self.postMessage('foo');`;
      const workerUrl = URL.createObjectURL(new Blob([workerSrc]));
      const BarcodeDetector = new BarcodeDetectorPolyfill(workerUrl);
      await BarcodeDetector.isReady;
      assert.fail('should not load');
    } catch (e) {
      assert.equal(e.message, 'Unexpected worker response');
    }
  });

  it('returns null if not ready', async () => {
    const workerSrc = `setTimeout(() => self.postMessage('ready'), 500);`;
    const workerUrl = URL.createObjectURL(new Blob([workerSrc]));
    const BarcodeDetector = new BarcodeDetectorPolyfill(workerUrl);
    const value = await BarcodeDetector.detect({} as HTMLImageElement);
    assert.isNull(value);
  });

  it('handles Image elements', async () => {
    const BarcodeDetector = new BarcodeDetectorPolyfill(workerValidUrl);
    await BarcodeDetector.isReady;
    const value = await BarcodeDetector.detect(new Image(20, 20));
    assert.isDefined(value);
  });

  it('handles ImageData', async () => {
    const BarcodeDetector = new BarcodeDetectorPolyfill(workerValidUrl);
    await BarcodeDetector.isReady;
    const value = await BarcodeDetector.detect(new ImageData(100, 100));
    assert.isDefined(value);
  });
});
