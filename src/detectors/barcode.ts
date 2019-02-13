/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { BarcodeDetector } from '../../defs/barcode.js';
import { injectScript } from '../utils/inject-script.js';
import { DEBUG_LEVEL, log } from '../utils/logger.js';

let detector: BarcodeDetector;
export async function detect(data: ImageData | ImageBitmap | HTMLCanvasElement,
                             context: {BarcodeDetector: typeof BarcodeDetector} = window,
                             forceNewDetector = false) {

  if (context === window && !('BarcodeDetector' in context)) {
    log('Native barcode detector unavailable', DEBUG_LEVEL.WARNING,
        'BarcodeDetector');
    await injectScript('/lib/polyfills/barcode-detector.js');
  }

  /* istanbul ignore else */
  if (!detector || forceNewDetector) {
    detector = new context.BarcodeDetector();
  }

  if ('isReady' in detector) {
    await detector.isReady;
  }

  try {
    return await detector.detect(data);
  } catch (e) {
    log(`Detection failed: ${e.message}`, DEBUG_LEVEL.WARNING);
    return [];
  }
}
