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

export const styles = `
:host {
  --baseline: 12px;
  position: fixed;
  display: block;
  top: 50%;
  left: 50%;
  min-width: 280px;
  padding: var(--baseline) calc(var(--baseline) * 2);
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  color: #FFF;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 18px;
  z-index: 2;
}

:host(.small) {
  font-size: 14px;
  top: auto;
  bottom: var(--baseline);
  min-width: 0;
  white-space: nowrap;
}
`;
