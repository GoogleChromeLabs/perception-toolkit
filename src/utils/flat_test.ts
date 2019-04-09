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

import { flatPolyfill } from './flat.js';

describe('Flat', () => {
  it('flattens 1 level deep', () => {
    assert.deepEqual(flatPolyfill([1, 2, [3, 4]]), [1, 2, 3, 4]);
  });

  it('flattens only 1 level deep by default', () => {
    assert.deepEqual(flatPolyfill([1, 2, [3, 4, [5, 6]]]), [1, 2, 3, 4, [5, 6]]);
  });

  it('flattens multiple levels deep when asked', () => {
    assert.deepEqual(flatPolyfill([1, 2, [3, 4, [5, 6]]], 2), [1, 2, 3, 4, 5, 6]);
  });

  it('removes empty slots in arrays', () => {
    assert.deepEqual(flatPolyfill([1, 2, /* none */, 4, 5]), [1, 2, 4, 5]);
  });
});
