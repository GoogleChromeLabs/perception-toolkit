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

async function initMM() {
  const meaningMaker = new MeaningMaker();
  await meaningMaker.init();
  return meaningMaker;
}

describe('Meaning Maker', () => {
  it('loads from URLs', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromUrl(url);
    assert.equal(artifacts.length, 1);
  });

  it('handles bad loads from URLs', async () => {
    const meaningMaker = await initMM();

    const url = new URL('bad-url.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromUrl(url);
    assert.equal(artifacts.length, 0);
  });

  it('loads from supported origins', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts =
        await meaningMaker.loadArtifactsFromSupportedUrl(url, (url: URL) => {
          return url.origin === window.origin;
        });
    assert.equal(artifacts.length, 1);
  });

  it('loads from same-origin if unspecified', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromSupportedUrl(url);
    assert.equal(artifacts.length, 1);
  });

  it('ignores unsupported origins', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts =
        await meaningMaker.loadArtifactsFromSupportedUrl(url, (url: URL) => {
          return false;
        });
    assert.equal(artifacts.length, 0);
  });

  it('supports origins as strings', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromSupportedUrl(url,
      [window.location.origin]);
    assert.equal(artifacts.length, 1);
  });

  it('returns all Image Targets as detectableImages', async () => {
    const meaningMaker = await initMM();

    const url = new URL('/base/test-assets/test-image.html', window.location.href);
    const artifacts = await meaningMaker.loadArtifactsFromSupportedUrl(url);
    const images = await meaningMaker.getDetectableImages();
    assert.equal(artifacts.length, 1, 'No artifacts');
    assert.equal(images.length, 1, 'No image artifacts');
  });

  it('finds and loses markers', async () => {
    const meaningMaker = await initMM();
    const url = new URL('/base/test-assets/test1.html', window.location.href);
    const marker = {
      type: 'qr_code',
      value: url.href
    };

    const foundResponse = await meaningMaker.markerFound(marker);
    assert.isDefined(foundResponse);
    assert.equal(foundResponse.found.length, 1);
    assert.equal(foundResponse.lost.length, 0);

    const loseRespones = await meaningMaker.markerLost(marker);
    assert.equal(loseRespones.found.length, 0);
    assert.equal(loseRespones.lost.length, 1);
  });

  it('finds and loses images', async () => {
    const meaningMaker = await initMM();
    const url = new URL('/base/test-assets/test-image.html', window.location.href);
    await meaningMaker.loadArtifactsFromUrl(url);

    const detectedImage = {
      id: 'Lighthouse'
    };

    const foundResponse = await meaningMaker.imageFound(detectedImage);
    assert.isDefined(foundResponse);
    assert.equal(foundResponse.found.length, 1);
    assert.equal(foundResponse.lost.length, 0);

    const loseRespones = await meaningMaker.imageLost(detectedImage);
    assert.equal(loseRespones.found.length, 0);
    assert.equal(loseRespones.lost.length, 1);
  });

  it('accepts updated locations without any geofenced artifacts', async () => {
    // Location updates do not change results.
    const meaningMaker = await initMM();
    const location = {
      latitude: 1,
      longitude: 1
    };

    const url = new URL('/base/test-assets/test1.html', window.location.href);
    await meaningMaker.loadArtifactsFromUrl(url);

    const marker = {
      type: 'qr_code',
      value: url.href
    };

    // Add the marker.
    const foundResponse = await meaningMaker.markerFound(marker);
    assert.isDefined(foundResponse);
    assert.equal(foundResponse.found.length, 1);
    assert.equal(foundResponse.lost.length, 0);

    // Filter it out with location.
    const locationResponse = await meaningMaker.updateGeolocation(location);
    assert.isDefined(locationResponse);
    assert.equal(locationResponse.found.length, 0);
    assert.equal(locationResponse.lost.length, 0);
  });
});
