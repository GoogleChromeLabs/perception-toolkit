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

import { defineElement } from './define-element.js';

describe('Define Element', () => {
  it('defines elements', () => {
    defineElement('x-foo', class Foo extends HTMLElement {});

    assert.ok(customElements.get('x-foo'));
  });

  it('does not allow double definitions', () => {
    class Bar extends HTMLElement {}

    assert.doesNotThrow(() => {
      defineElement('x-bar', Bar);
      defineElement('x-bar', Bar);
    });
  });
});
