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

declare global {
  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
  }
}

const { assert } = chai;

import { isImageData } from '../../utils/is-image-data.js';
import { frameEvent, startEvent, stopEvent, StreamCapture } from './stream-capture.js';
customElements.define(StreamCapture.defaultTagName, StreamCapture);

const width = 400;
const height = 402;
function mockInputStream() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;

  // Draw a pink left half, and a green right half.
  const render = () => {
    ctx.fillStyle = `#F0F`;
    ctx.fillRect(0, 0, width * 0.5, height);
    ctx.fillStyle = `#0F0`;
    ctx.fillRect(width * 0.5, 0, width * 0.5, height);
  };

  return {
    render,
    stream: canvas.captureStream()
  };
}

describe('StreamCapture', function() {
  let capture: StreamCapture;
  let stream: MediaStream;
  let streamRequiresUpdate = false;
  let render: () => void;

  // Force an update to the stream, otherwise Safari considers the video
  // to be in some way ended.
  const updateStream = () => {
    render();
    if (!streamRequiresUpdate) {
      return;
    }

    requestAnimationFrame(() => updateStream());
  };

  beforeEach(() => {
    capture = new StreamCapture();
    const mock = mockInputStream();
    stream = mock.stream;
    render = mock.render;
    streamRequiresUpdate = true;

    requestAnimationFrame(() => updateStream());
  });

  afterEach(() => {
    streamRequiresUpdate = false;
    capture.stop();
  });

  it('captures images', (done) => {
    capture.start(stream);

    capture.addEventListener(startEvent, async () => {
      const imgData = await capture.captureFrame();
      assert.equal(imgData.width, width * capture.captureScale);
      assert.equal(imgData.height, height * capture.captureScale);

      if (isImageData(imgData)) {
        assert.isAbove(imgData.data[0], 250);
      } else {
        assert.fail('Expected image data');
      }

      done();
    });
  });

  it('creates image elements', (done) => {
    capture.start(stream);
    capture.capturePng = true;

    capture.addEventListener(startEvent, async () => {
      const imgData = await capture.captureFrame();
      assert.equal(imgData.width, width * capture.captureScale);
      assert.equal(imgData.height, height * capture.captureScale);

      if (isImageData(imgData)) {
        assert.fail('Expected PNG data');
      } else {
        assert.equal(imgData.tagName, 'IMG');
      }
      done();
    });
  });

  it('emits imageData frame events', (done) => {
    capture.start(stream);
    capture.captureRate = 100;

    capture.addEventListener(frameEvent, (evt) => {
      const { detail } = evt as CustomEvent<{imgData: ImageData}>;
      const { imgData } = detail;

      assert.equal(imgData.width, width * capture.captureScale);
      assert.equal(imgData.height, height * capture.captureScale);
      assert.isAbove(imgData.data[0], 250);

      done();
    });
  });

  it('emits image element frame events', (done) => {
    capture.start(stream);
    capture.capturePng = true;
    capture.captureRate = 100;

    capture.addEventListener(frameEvent, (evt) => {
      const { detail } = evt as CustomEvent<{imgData: HTMLImageElement}>;
      const { imgData } = detail;

      assert.equal(imgData.naturalWidth, width * capture.captureScale);
      assert.equal(imgData.naturalHeight, height * capture.captureScale);

      done();
    });
  });

  it('flips the capture if necessary', (done) => {
    capture.flipped = true;
    capture.start(stream);

    capture.addEventListener(startEvent, async () => {
      const imgData = await capture.captureFrame();
      assert.equal(imgData.width, width * capture.captureScale);
      assert.equal(imgData.height, height * capture.captureScale);

      if (isImageData(imgData)) {
        // Right hand side is green, so confirm the G and R components.
        assert.isBelow(imgData.data[0], 5);
        assert.isAbove(imgData.data[1], 250);
      } else {
        assert.fail('Expected image data');
      }

      done();
    });
  });

  it('throws if started twice', () => {
    capture.start(stream);
    assert.throws(() => {
      capture.start(stream);
    });
  });

  it('stops when disconnected', (done) => {
    capture.start(stream);
    document.body.appendChild(capture);

    setTimeout(() => {
      capture.addEventListener(stopEvent, () => {
        done();
      });
      capture.remove();
    }, 100);
  });

  it('handles stop calls when already stopped', (done) => {
    capture.start(stream);
    capture.addEventListener(startEvent, () => {
      capture.stop();
      assert.doesNotThrow(() => capture.stop());
      done();
    });
  });
});
