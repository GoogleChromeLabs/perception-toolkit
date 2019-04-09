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
 * The flat() method creates a new array with all sub-array elements concatenated into it.
 * Unlike Array.prototoype.flat, does not support recursively flattening up to the specified depth.
 */
export function flatPolyfill<U>(arr: any[], depth?: number): any[] {
  // As Per: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
  // flat() is equivalent to:
  const flatOnce = (arr: any[]) => arr.reduce((acc, val) => acc.concat(val), []);
  let ret = flatOnce(arr);

  // This will iteratively flatten, depth number of times.
  if (depth) {
    for (let i = 1; i < depth; i++) {
      ret = flatOnce(ret);
    }
  }
  return ret;
}

/* istanbul ignore next */
export function flat<U = {}>(arr: U[], depth?: number): U[] {
  if ('flat' in Array.prototype) {
    return arr.flat(depth);
  } else {
    return flatPolyfill(arr);
  }
}
