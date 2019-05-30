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

import { replace, restore } from 'sinon';

const { assert } = chai;

import { geolocation } from './geolocation-async.js';

describe('GetUserMediaSupport', () => {
  afterEach(() => {
    restore();
  });

  it('returns a boolean', async () => {
    const data = {
      coords: {
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        latitude: 2,
        longitude: 3,
        speed: null
      },

      timestamp: 0
    };

    replace(navigator.geolocation, 'getCurrentPosition',
        (successCallback: PositionCallback) => {
          successCallback.call(null, data);
        });

    const value = await geolocation();
    assert.deepEqual(value, data.coords);
  });
});
