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

import { Marker } from '../defs/marker';
import { ArtifactDealer, NearbyResultDelta } from '../src/artifacts/artifact-dealer';
import { ArtifactLoader } from '../src/artifacts/artifact-loader';
import { ARArtifact } from '../src/artifacts/schema/ar-artifact';
import { GeoCoordinates } from '../src/artifacts/schema/geo-coordinates';
import { LocalArtifactStore } from '../src/artifacts/stores/local-artifact-store';

type SupportedOriginsCallback = (origin: string) => boolean;
type SupportedOrigins = SupportedOriginsCallback | string[];

function isSupportedOriginsCallback(s: SupportedOrigins): s is SupportedOriginsCallback {
  return typeof s === 'function';
}

/*
 * MeaningMaker binds the Artifacts components with the rest of the Perception Toolkit.
 * It providess a good set of default behaviours, and can be replaced with alternative
 * strategies in some demos.
 *
 * Things MeaningMaker does:
 * * Creates a default Artifact Loader, Store, and Dealer.
 * * Loads Artifacts from Document automatically on init.
 * * Attempts to index Pages automatically when Markers are URLs.
 */
export class MeaningMaker {
  private readonly artloader = new ArtifactLoader();
  private readonly artstore = new LocalArtifactStore();
  private readonly artdealer = new ArtifactDealer();

  constructor() {
    this.artdealer.addArtifactStore(this.artstore);
  }

  /**
   * Load artifact content for initial set.
   */
  async init() {
    const artifacts = await this.artloader.fromElement(document, document.URL);
    this.saveArtifacts(artifacts);
  }

  /**
   * Load artifact content for initial set.
   */
  async loadArtifactsFromJsonldUrl(url: URL) {
    const artifacts = await this.artloader.fromJsonUrl(url);
    this.saveArtifacts(artifacts);
  }

  /**
   * Load artifact content from url on same origin, usually discovered from environment.
   */
  async loadArtifactsFromValidOriginUrls(url: URL, supportedOrigins?: SupportedOrigins) {
    // If there is a set of supported provided, use that. Otherwise ensure that
    // the origin of the target and hosting document match.
    if (supportedOrigins) {
      if (isSupportedOriginsCallback(supportedOrigins)) {
        if (!supportedOrigins(url.origin)) {
          return;
        }
      } else {
        if (!supportedOrigins.find(o => o === url.origin)) {
          return;
        }
      }
    } else if (url.origin !== window.location.origin) {
      return;
    }

    const artifacts = await this.artloader.fromHtmlUrl(url);
    for (const artifact of artifacts) {
      this.artstore.addArtifact(artifact);
    }
  }

  async markerFound(marker: Marker, supportedOrigins?: SupportedOrigins):
      Promise<NearbyResultDelta> {
    // If this marker is a URL, try loading artifacts from that URL
    try {
      // Attempt to convert markerValue to URL.  This will throw if markerValue isn't a valid URL.
      // Do not supply a base url argument, since we do not want to support relative URLs,
      // and because that would turn lots of normal string values into valid relative URLs.
      const url = new URL(marker.value);
      await this.loadArtifactsFromValidOriginUrls(url, supportedOrigins);
    } catch (_) {
      // Do nothing if this isn't a valid URL
    }

    return this.artdealer.markerFound(marker);
  }

  async markerLost(marker: Marker): Promise<NearbyResultDelta> {
    return this.artdealer.markerLost(marker);
  }

  async updateGeolocation(coords: GeoCoordinates): Promise<NearbyResultDelta> {
    return this.artdealer.updateGeolocation(coords);
  }

  private saveArtifacts(artifacts: ARArtifact[]) {
    for (const artifact of artifacts) {
      this.artstore.addArtifact(artifact);
    }
  }
}
