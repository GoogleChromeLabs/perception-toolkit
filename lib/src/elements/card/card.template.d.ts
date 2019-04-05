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
export declare const styles = "\n:host {\n  --baseline: 16px;\n  --background: #FFF;\n  --borderRadius: 5px;\n  --color: #333;\n  --fontFamily: 'Arial', 'Helvetica', sans-serif;\n  --padding: calc(var(--baseline) * 2)\n      calc(var(--baseline) * 2)\n      calc(var(--baseline) * 1)\n      calc(var(--baseline) * 2);\n\n  position: relative;\n  display: inline-block;\n  align-items: center;\n  justify-content: center;\n  overflow: hidden;\n  border-radius: var(--borderRadius);\n  font-family: var(--fontFamily);\n  background: var(--background);\n  color: var(--color);\n}\n\n#container {\n  white-space: nowrap;\n}\n\n#container.padded {\n  padding: var(--padding);\n}\n\n#close {\n  width: 24px;\n  height: 24px;\n  background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTkgNi40MUwxNy41OSA1IDEyIDEwLjU5IDYuNDEgNSA1IDYuNDEgMTAuNTkgMTIgNSAxNy41OSA2LjQxIDE5IDEyIDEzLjQxIDE3LjU5IDE5IDE5IDE3LjU5IDEzLjQxIDEyeiIvPjxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=);\n  position: absolute;\n  top: 8px;\n  right: 8px;\n  font-size: 0;\n  border: none;\n  cursor: pointer;\n  opacity: 0.7;\n  transition: opacity 0.3s cubic-bezier(0, 0, 0.3, 1);\n}\n\n#close:hover {\n  opacity: 1;\n}\n\nslot::slotted(*) {\n  flex: 1;\n  border-right: 1px solid #CCC;\n}\n\nslot::slotted(*:last-child) {\n  border-right: none;\n}\n\nslot {\n  display: flex;\n  border-top: 1px solid #AAA;\n}\n\n:host(:empty) slot {\n  border: none;\n}\n\n#title {\n  padding: var(--baseline);\n  padding-bottom: 0;\n  font-size: 18px;\n  font-weight: 400;\n  margin: 0;\n  color: #3A3A3A;\n}\n\n#description {\n  padding: 0 var(--baseline);\n  padding-top: 6px;\n  font-size: 14px;\n  font-weight: 400;\n  margin: 0;\n  color: #696969;\n}\n\n#image {\n  margin-top: var(--baseline);\n  background-color: #111;\n  background-size: cover;\n  background-position: center center;\n  min-width: 300px;\n  min-height: 210px;\n  transition: background-image 1s ease-out;\n}\n";
export declare const html = "\n  <button id=\"close\">Close</button>\n  <div id=\"container\"></div>\n  <div id=\"slotted-content\"><slot></slot></div>\n";
