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

import { ArtifactDecoder } from './artifact-decoder.js';
import { ARArtifact } from './schema/extension-ar-artifacts.js';
import { JsonLd } from './schema/json-ld.js';
import { flat } from '../utils/flat.js';

// TODO: Consider merging from*Url functions and just branching on response content-type
export class ArtifactLoader {
  private readonly decoder = new ArtifactDecoder();

  async fromUrl(url: URL|string): Promise<ARArtifact[]> {
    const response = await fetch(url.toString(), { credentials: 'include' });
    if (!response.ok) {
        throw Error(response.statusText);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType) {
      return [];
    }

    if (contentType.indexOf('application/json') !== -1 || contentType.indexOf('application/ld+json') !== -1) {
      const json = await response.json();
      return this.fromJson(json);
    } else {
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return this.fromElement(doc, url);
    }
  }

  async fromHtmlUrl(url: URL|string): Promise<ARArtifact[]> {
    // Note: according to MDN, can use XHR request to create Document direct from URL
    // This may be better, because could have document.location.href (etc) settings automatically?
    // Note: this already proved issue when getting .src property of script/link tags, since relative
    // Urls are based off this document root, not the fetched source.

    const response = await fetch(url.toString(), { credentials: 'include' });
    if (!response.ok) {
        throw Error(response.statusText);
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return this.fromElement(doc, url);
  }

  async fromJsonUrl(url: URL|string): Promise<ARArtifact[]> {
    const response = await fetch(url.toString(), { credentials: 'include' });
    if (!response.ok) {
        throw Error(response.statusText);
    }
    const json = await response.json();
    return this.fromJson(json);
  }

  async fromElement(el: NodeSelector, url: URL|string): Promise<ARArtifact[]> {
    const ret = [];

    const inlineScripts = el.querySelectorAll('script[type=\'application/ld+json\']:not([src])');
    for (const jsonldScript of inlineScripts) {
      ret.push(this.fromJson(JSON.parse(jsonldScript.textContent || '')));
    }

    const externalScripts = el.querySelectorAll('script[type=\'application/ld+json\'][src]');
    for (const jsonldScript of externalScripts) {
      const src = jsonldScript.getAttribute('src');
      if (!src) { continue; }
      ret.push(this.fromJsonUrl(new URL(src, /* base= */ url)));
    }

    const jsonldLinks = el.querySelectorAll('link[rel=\'alternate\'][type=\'application/ld+json\'][href]');
    for (const jsonldLink of jsonldLinks) {
      const href = jsonldLink.getAttribute('href');
      if (!href) { continue; }
      ret.push(this.fromJsonUrl(new URL(href, /* base= */ url)));
    }

    return flat(await Promise.all(ret));
  }

  async fromJson(json: JsonLd): Promise<ARArtifact[]> {
    return this.decoder.decode(json);
  }
}
