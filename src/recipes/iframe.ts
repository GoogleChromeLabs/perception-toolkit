/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import { SimpleCard } from '../elements/simple-card/simple-card.js';
customElements.define(SimpleCard.defaultTagName, SimpleCard);

const card = new SimpleCard();
card.src = new URL('/demo/simple-card/content/external-frame.html',
    window.location.toString());

card.width = 300;
card.height = 196;
card.style.setProperty('--borderRadius', '10px');
card.style.setProperty('--padding', '0');

const container = document.querySelector('#container')!;
container.appendChild(card);