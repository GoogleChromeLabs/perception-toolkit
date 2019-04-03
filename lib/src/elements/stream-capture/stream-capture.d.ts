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
export declare const captureStopped = "pt.capturestopped";
/**
 * The name for captured frame events.
 */
export declare const frameEvent = "pt.captureframe";
/**
 * The name for start capture events.
 */
export declare const startEvent = "pt.capturestarted";
/**
 * The name for stop capture events.
 */
export declare const stopEvent = "pt.capturestopped";
/**
 * The name for stop capture events.
 */
export declare const closeEvent = "pt.captureclose";
/**
 * Provides an element that abstracts the capture of stream frames. For example,
 * given a `getUserMedia` video stream, this will -- if desired -- capture an
 * image from the stream, downsample it, and emit an event with the pixel data.
 *
 * **Note that, due to the internal reliance on `requestAnimationFrame`, the
 * capture element must be attached to the DOM, and the tab visible.**
 *
 * ```javascript
 * const capture = new StreamCapture();
 *
 * // Capture every 600ms at 50% scale.
 * capture.captureRate = 600;
 * capture.captureScale = 0.5;
 *
 * // Attempt to get the camera's stream and start monitoring.
 * const stream = await navigator.mediaDevices.getUserMedia({ video: true});
 * capture.start(stream);
 *
 * // Append and listen to captures.
 * document.body.appendChild(capture);
 * capture.addEventListener(StreamCapture.frameEvent, (e) => {
 *   const { imgData } = e.detail;
 *
 *   // Process the ImageData.
 * });
 * ```
 */
export declare class StreamCapture extends HTMLElement {
    /**
     * The StreamCapture's default tag name for registering with
     * `customElements.define`.
     */
    static defaultTagName: string;
    /**
     * The sample scale, intended to go between `0` and `1` (though clamped only
     * to `0` in case you wish to sample at a larger scale).
     */
    captureScale: number;
    /**
     * How often to capture the stream in ms, where `0` represents never.
     * Note that you can cause performance issues if `captureRate` is higher than
     * the speed at which the captured pixels can be processed.
     */
    captureRate: number;
    /**
     * Whether to capture a PNG `HTMLImageElement` instead of `ImageData`
     * (the default).
     */
    capturePng: boolean;
    /**
     * Whether to flip the stream's image.
     */
    flipped: boolean;
    /**
     * Whether to pause the frame.
     */
    paused: boolean;
    private video;
    private stream;
    private canvas;
    private ctx;
    private root;
    private lastCapture;
    constructor();
    /**
     * @ignore Only public because it's a Custom Element.
     */
    disconnectedCallback(): void;
    /**
     * Starts the capture of the stream.
     */
    start(stream: MediaStream): void;
    /**
     * Manually captures a frame. Intended to be used when `captureRate` is `0`.
     */
    captureFrame(): Promise<ImageData | HTMLImageElement>;
    /**
     * Stops the stream.
     */
    stop(): void;
    private setReticleOrientation;
    private initElementsIfNecessary;
}
