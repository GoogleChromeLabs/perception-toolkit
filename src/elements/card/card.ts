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
  interface Event {
    path: Element[];
  }
}

import { fade } from '../../utils/fade.js';
import { DEBUG_LEVEL, log } from '../../utils/logger.js';
import { html, styles } from './card.template.js';

export interface CardData {
  name?: string;
  disambiguatingDescription?: string;
  description?: string;
  image?: string;
  price?: {
    value: string;
    currency: string;
  };
  url?: string;
}

/**
 * A data card for information output.
 *
 * ```javascript
 * // Text card.
 * const card = new Card();
 * card.src = 'Card Message';
 *
 * // Or iframe some content in. By default the card supports same-origin
 * // content.
 * card.src = new URL('http://example.com');
 * ```
 */
export class Card extends HTMLElement {
  /**
   * The Cards's default tag name for registering with `customElements.define`.
   */
  static defaultTagName = 'data-card';

  /**
   * The duration of the card's fade animation when dismissed.
   */
  fadeDuration = 200;

  /**
   * The sandbox attributes to use for card sources that are iframed in. By
   * default the iframed content is assumed to be same origin but not allowed to
   * execute scripts.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox
   */
  sandboxAttribute: string = 'allow-same-origin';

  private srcInternal: string | URL | CardData = '';
  private widthInternal: number | undefined;
  private heightInternal: number | undefined;
  private root = this.attachShadow({ mode: 'open' });
  private onClickBound = this.onClick.bind(this);

  /* istanbul ignore next */
  constructor() {
    super();
  }

  /**
   * Gets & sets the src for the card. If the src is a URL the content is
   * `iframe`'d in using a sandbox that disallows
   */
  get src() {
    return this.srcInternal;
  }

  set src(src: string | URL | CardData) {
    this.srcInternal = src;
    this.render();
  }

  /**
   * Gets & sets the width of the card.
   */
  get width() {
    return this.widthInternal;
  }

  set width(width: number | undefined) {
    this.widthInternal = width;
    this.setDimensions();
  }

  /**
   * Gets & sets the height of the card.
   */
  get height() {
    return this.heightInternal;
  }

  set height(height: number | undefined) {
    this.heightInternal = height;
    this.setDimensions();
  }

  /**
   * @ignore Only public because it's a Custom Element.
   */
  connectedCallback() {
    this.root.innerHTML = `<style>${styles}</style> ${html}`;
    this.render();
    this.setDimensions();

    this.addEventListener('click', this.onClickBound);
  }

  /**
   * @ignore Only public because it's a Custom Element.
   */
  disconnectedCallback() {
    this.removeEventListener('click', this.onClickBound);
  }

  /**
   * Closes the card with an optional fade.
   */
  async close(fadeDuration = this.fadeDuration) {
    if (fadeDuration === 0) {
      this.remove();
      return;
    }

    await fade(this, { duration: fadeDuration });
    this.remove();
  }

  private async onClick(evt: Event) {
    const clicked =
        evt.path ? evt.path[0] : evt.composedPath()[0] as HTMLElement;
    if (clicked.id !== 'close') {
      return;
    }

    await this.close();
  }

  private render() {
    const container = this.root.querySelector('#container') as HTMLElement;
    if (!container) {
      return;
    }

    container.classList.remove('padded');
    if (this.srcIsString(this.src)) {
      container.textContent = this.src;
      container.classList.add('padded');
    } else if (this.srcIsCardData(this.src)) {
      this.renderCardData(this.src);
    } else if (this.srcIsUrl(this.src)) {
      const iframe = document.createElement('iframe');
      iframe.src = this.src.toString();
      iframe.setAttribute('sandbox', this.sandboxAttribute);
      iframe.style.border = 'none';
      iframe.id = 'external-content';
      iframe.width = (this.width || 0).toString();
      iframe.height = (this.height || 0).toString();

      container.appendChild(iframe);
    } else {
      log(`Unexpected card content: ${this.src}`, DEBUG_LEVEL.WARNING);
      container.textContent = 'Unexpected content';
      container.classList.add('padded');
    }
  }

  private renderCardData(data: CardData) {
    const container = this.root.querySelector('#container') as HTMLElement;
    if (!container) {
      return;
    }

    container.innerHTML = '';
    if (data.name) {
      const title = document.createElement('h1');
      title.setAttribute('id', 'title');
      title.textContent = data.name;
      container.appendChild(title);
    }

    if (data.description) {
      const description = document.createElement('div');
      description.setAttribute('id', 'description');
      description.textContent = data.description;

      container.appendChild(description);
    }

    if (data.image) {
      const img = document.createElement('div');
      img.setAttribute('id', 'image');
      img.style.backgroundImage = `url(${data.image})`;

      container.appendChild(img);
    }
  }

  private srcIsString(msg: string | URL | CardData): msg is string {
    return typeof msg === 'string';
  }

  private srcIsCardData(msg: string | URL | CardData): msg is CardData {
    return typeof msg === 'object' && typeof (msg as URL).href === 'undefined';
  }

  private srcIsUrl(msg: string | URL | CardData): msg is URL {
    return typeof msg === 'object' && typeof (msg as URL).href !== 'undefined';
  }

  private setDimensions() {
    const container = this.root.querySelector('#container') as HTMLElement;
    if (!container) {
      return;
    }

    if (this.widthInternal) {
      container.style.width = `${this.widthInternal}px`;
    }

    if (this.heightInternal) {
      container.style.height = `${this.heightInternal}px`;
    }
  }
}
