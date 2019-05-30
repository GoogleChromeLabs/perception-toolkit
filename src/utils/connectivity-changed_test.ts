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

import { replaceGetter, restore } from 'sinon';
import { observeConnectivityChanges, unobserveConnectivityChanges } from './connectivity-changed';

describe('Connectivity Changed', () => {

  let connected = false;
  beforeEach(() => {
    observeConnectivityChanges();
    replaceGetter(navigator, 'onLine', () => {
      console.log('CONNECTED:', connected);
      return connected;
    });
  });

  afterEach(() => {
    restore();
    unobserveConnectivityChanges();
  });

  it('observes connectivity states', () => {
    // Go "offline".
    connected = false;
    window.dispatchEvent(new Event('offline'));

    // Check that there's an overlay.
    assert.isNotNull(document.querySelector('#pt\\.overlay'));

    // Now go "online".
    connected = true;
    window.dispatchEvent(new Event('online'));

    // Check there is no overlay.
    assert.isNull(document.querySelector('#pt\\.overlay'));
  });
});
