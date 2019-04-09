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

import { flatMapPolyfill as flatMap } from './flat-map.js';

describe('FlatMap', () => {
  const arr1 = [1, 2, 3, 4];

  it('maps just like map when there is no nesting', () => {
    assert.deepEqual(flatMap(arr1, x => x * 2), arr1.map(x => x * 2));
  });

  it('maps and flattens one level deep', () => {
    assert.deepEqual(flatMap(arr1, x => [x * 2]), [2, 4, 6, 8]);
  });

  it('flattens exactly one level deep', () => {
    assert.deepEqual(flatMap(arr1, x => [[x * 2]]), [[2], [4], [6], [8]]);
  });

  it('handles n:m input:output elements', () => {
    // As per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap
    assert.deepEqual(
      flatMap(
        [5, 4, -3, 20, 17, -33, -4, 18],
        (n) => (n < 0) ? [] : (n % 2 === 0) ? [n] : [n - 1, 1]
      ),
      [4, 1, 4, 20, 16, 1, 18]
    );
  });
});
