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
  interface Window {
    BarcodeDetector: typeof BarcodeDetector;
  }
}

import { BarcodeDetector } from '../../../defs/barcode.js';
import { Marker } from '../../../defs/marker.js';
import { injectScript } from '../../utils/inject-script.js';
import { DEBUG_LEVEL, log } from '../../utils/logger.js';

let detector: BarcodeDetector;

/**
 * Detects barcodes from image sources.
 */
export async function detectBarcodes(data: ImageData | ImageBitmap | HTMLCanvasElement,
                                     {
                                       context = window,
                                       forceNewDetector = false,
                                       polyfillRequired = false,
                                       root = ''
                                     } = {}): Promise<Marker[]> {

  const loadPolyfill = polyfillRequired ||
      (context === window && !('BarcodeDetector' in context));
  if (loadPolyfill) {
    log('Using barcode detection polyfill', DEBUG_LEVEL.INFO,
        'BarcodeDetector');
    await injectScript(`${root}/lib/polyfills/barcode-detector.js`);
  }

  /* istanbul ignore else */
  if (!detector || forceNewDetector) {
    detector = new context.BarcodeDetector();
  }

  /* istanbul ignore else */
  if ('isReady' in detector) {
    await detector.isReady;
  }

  try {
    const barcodes = await detector.detect(data);
    return barcodes.map((barcode) => {
      return {
        type: barcode.format,
        value: barcode.rawValue
      };
    });
  } catch (e) {
    // If the polyfill has loaded but there are still issues, exit.
    if (polyfillRequired) {
      return [];
    }

    log(`Detection failed: ${e.message}`, DEBUG_LEVEL.WARNING);
    return await detectBarcodes(data,
        {
          context,
          forceNewDetector,
          polyfillRequired: true,
          root,
        });
  }
}
