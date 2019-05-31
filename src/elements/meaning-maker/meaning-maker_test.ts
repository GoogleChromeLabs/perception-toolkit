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

import { MeaningMaker } from './meaning-maker.js';

describe.only('Meaning Maker', () => {
  it('loads from URLs', async () => {
    const meaningMaker = new MeaningMaker();
    await meaningMaker.init();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromUrl(url);
    assert.equal(artifacts.length, 1);
  });

  it('handles bad loads from URLs', async () => {
    const meaningMaker = new MeaningMaker();
    await meaningMaker.init();

    const url = new URL('bad-url.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromUrl(url);
    assert.equal(artifacts.length, 0);
  });

  it('loads from supported origins', async () => {
    const meaningMaker = new MeaningMaker();
    await meaningMaker.init();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts =
        await meaningMaker.loadArtifactsFromSupportedUrl(url, (url: URL) => {
          return url.origin === window.origin;
        });
    assert.equal(artifacts.length, 1);
  });

  it('loads from same-origin if unspecified', async () => {
    const meaningMaker = new MeaningMaker();
    await meaningMaker.init();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromSupportedUrl(url);
    assert.equal(artifacts.length, 1);
  });

  it('ignores unsupported origins', async () => {
    const meaningMaker = new MeaningMaker();
    await meaningMaker.init();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts =
        await meaningMaker.loadArtifactsFromSupportedUrl(url, (url: URL) => {
          return false;
        });
    assert.equal(artifacts.length, 0);
  });

  it('supports origins as strings', async () => {
    const meaningMaker = new MeaningMaker();
    await meaningMaker.init();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromSupportedUrl(url,
      [window.location.origin]);
    assert.equal(artifacts.length, 1);
  });

  it('supports origins as strings', async () => {
    const meaningMaker = new MeaningMaker();
    await meaningMaker.init();

    const url = new URL('/base/test-assets/test-image.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromSupportedUrl(url);
    const images = await meaningMaker.getDetectableImages();
    assert.equal(artifacts.length, 1, 'No artifacts');
    assert.equal(images.length, 1, 'No image artifacts');
  });
});
