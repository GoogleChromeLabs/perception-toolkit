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

import { styles } from './overlay.template.js';

function getOverlay({ id = 'pt.overlay', small = false, create = true } = {}) {
  const existingOverlay = document.getElementById(id);
  if (existingOverlay) {
    return existingOverlay;
  }

  if (!create) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = id;
  const root = overlay.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${styles}</style><span class="content"><slot></slot></span>`;

  if (small) {
    overlay.classList.add('small');
  }

  return overlay;
}

/**
 * Shows an overlay message. If there is already an overlay message a second
 * call will update the message rather than create a new overlay.
 *
 * @hidden
 */
export function showOverlay(message: string,
                            {
                              target = document.body,
                              id = 'pt.overlay',
                              small = false
                            } = {}) {
  const overlay = getOverlay({id, small});
  if (!overlay) {
    return;
  }

  overlay.textContent = message;
  target.appendChild(overlay);
  return overlay;
}

/**
 * Hides the overlay if there is one.
 *
 * @hidden
 */
export function hideOverlay({id = 'pt.overlay'} = {}) {
  const overlay = getOverlay({id});
  if (!overlay) {
    return;
  }

  overlay.remove();
}
