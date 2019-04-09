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
 * The flatMap() method first maps each element using a mapping function, then flattens the result into a new array.
 * It is identical to a map followed by a flat of depth 1.
 */
export function flatMapPolyfill<T, U>(
      arr: T[],
      callback: (value: T, index: number, array: T[]) => U|ReadonlyArray<U>
    ): U[] {
  // As per: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap
  // flatMap is equivalent to map + flat, or reduce + concat.
  // flat() is not available on all platforms, so using reduce + concat
  return arr.reduce((acc: U[], x: T, i: number, arr: T[]) => {
    const val = callback(x, i, arr);
    if (Array.isArray(val)) {
      return acc.concat(val);
    } else {
      acc.push(val as U);
      return acc;
    }
  }, []);
}

/* istanbul ignore next */
export function flatMap<T, U, This = undefined>(
      arr: T[],
      callback: (this: This, value: T, index: number, array: T[]) => U|ReadonlyArray<U>,
      thisArg?: This
    ): U[] {
  if ('flatMap' in Array.prototype) {
    return arr.flatMap(callback);
  } else {
    return flatMapPolyfill(arr, callback);
  }
}
