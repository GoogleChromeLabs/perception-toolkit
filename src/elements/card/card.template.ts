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

// tslint:disable:max-line-length
export const styles = `
:host {
  --baseline: 16px;
  --background: #FFF;
  --borderRadius: 5px;
  --color: #333;
  --fontFamily: 'Arial', 'Helvetica', sans-serif;
  --padding: calc(var(--baseline) * 2)
      calc(var(--baseline) * 2)
      calc(var(--baseline) * 1)
      calc(var(--baseline) * 2);

  position: relative;
  display: inline-block;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--borderRadius);
  font-family: var(--fontFamily);
  background: var(--background);
  color: var(--color);
}

#container {
  white-space: nowrap;
}

#container.padded {
  padding: var(--padding);
}

#close {
  width: 24px;
  height: 24px;
  background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTkgNi40MUwxNy41OSA1IDEyIDEwLjU5IDYuNDEgNSA1IDYuNDEgMTAuNTkgMTIgNSAxNy41OSA2LjQxIDE5IDEyIDEzLjQxIDE3LjU5IDE5IDE5IDE3LjU5IDEzLjQxIDEyeiIvPjxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=);
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s cubic-bezier(0, 0, 0.3, 1);
}

#close:hover {
  opacity: 1;
}

slot::slotted(*) {
  flex: 1;
  border-right: 1px solid #CCC;
}

slot::slotted(*:last-child) {
  border-right: none;
}

slot {
  display: flex;
  border-top: 1px solid #AAA;
}

:host(:empty) slot {
  border: none;
}

#title {
  padding: var(--baseline);
  padding-bottom: 0;
  font-size: 18px;
  font-weight: 400;
  margin: 0;
  color: #3A3A3A;
}

#description {
  padding: 0 var(--baseline);
  padding-top: 6px;
  font-size: 14px;
  font-weight: 400;
  margin: 0;
  color: #696969;
}

#image {
  margin-top: var(--baseline);
  background-color: #111;
  background-size: cover;
  background-position: center center;
  min-width: 300px;
  min-height: 210px;
  transition: background-image 1s ease-out;
}
`;

// tslint:enable:max-line-length

export const html = `
  <button id="close">Close</button>
  <div id="container"></div>
  <div id="slotted-content"><slot></slot></div>
`;
