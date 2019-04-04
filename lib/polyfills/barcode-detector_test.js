(function () {
  'use strict';

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
   * Convenience function used internally for detecting `ImageData` vs
   * `HTMLImageElement`.
   */
  function isImageData(imgData) {
      return typeof imgData.data !== 'undefined';
  }

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
  class BarcodeDetectorPolyfill {
      constructor(path = 'barcode-detector_worker.js') {
          this.canvas = document.createElement('canvas');
          this.ctx = this.canvas.getContext('2d');
          this.hasLoaded = false;
          let prefix = '/';
          if (typeof BarcodeDetectorPolyfill.loadedFrom !== 'undefined') {
              const prefixUrl = new URL(path, BarcodeDetectorPolyfill.loadedFrom);
              path = prefixUrl.href;
              prefix = prefixUrl.href.replace(/lib.*/, '');
          }
          this.worker = new Worker(path);
          this.worker.postMessage(prefix);
          this.isReadyInternal = new Promise((resolve, reject) => {
              this.worker.onmessage = (e) => {
                  if (e.data === 'ready') {
                      this.hasLoaded = true;
                      resolve(this.hasLoaded);
                  }
                  else {
                      reject(new Error('Unexpected worker response'));
                  }
              };
          });
          /* istanbul ignore next */
          window.addEventListener('unload', () => {
              this.worker.terminate();
          });
      }
      get isReady() {
          return this.isReadyInternal;
      }
      async detect(pixels) {
          if (!this.hasLoaded) {
              return null;
          }
          return new Promise(async (resolve) => {
              let imageData;
              if (isImageData(pixels)) {
                  imageData = pixels;
              }
              else {
                  let width = pixels.width;
                  let height = pixels.height;
                  if ('naturalWidth' in pixels && pixels.naturalWidth) {
                      width = pixels.naturalWidth;
                  }
                  if ('naturalHeight' in pixels && pixels.naturalHeight) {
                      height = pixels.naturalHeight;
                  }
                  this.canvas.width = width;
                  this.canvas.height = height;
                  this.ctx.drawImage(pixels, 0, 0);
                  imageData =
                      this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
              }
              this.worker.onmessage = (evt) => {
                  resolve(evt.data);
              };
              this.worker.postMessage(imageData);
          });
      }
  }
  // Prevent overwriting the built-in.
  /* istanbul ignore next */
  if (!('BarcodeDetector' in self)) {
      const script = document.currentScript;
      window.BarcodeDetector = BarcodeDetectorPolyfill;
      BarcodeDetectorPolyfill.loadedFrom = new URL(script.src, window.location.toString());
  }

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
          }
          catch (e) {
              assert.equal(e.message, 'Unexpected worker response');
          }
      });
      it('returns null if not ready', async () => {
          const workerSrc = `setTimeout(() => self.postMessage('ready'), 500);`;
          const workerUrl = URL.createObjectURL(new Blob([workerSrc]));
          const BarcodeDetector = new BarcodeDetectorPolyfill(workerUrl);
          const value = await BarcodeDetector.detect({});
          assert.isNull(value);
      });
      it.only('handles Image elements', async () => {
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

}());
