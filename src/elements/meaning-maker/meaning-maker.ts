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

import { DetectableImage, DetectedImage } from '../../../defs/detected-image.js';
import { Marker } from '../../../defs/marker.js';
import { ArtifactDealer, NearbyResultDelta } from '../../../src/artifacts/artifact-dealer.js';
import { ArtifactLoader } from '../../artifacts/artifact-loader.js';
import { GeoCoordinates } from '../../artifacts/schema/core-schema-org.js';
import { ARArtifact } from '../../artifacts/schema/extension-ar-artifacts.js';
import { LocalArtifactStore } from '../../artifacts/stores/local-artifact-store.js';
import { ArtifactStore } from '../../artifacts/stores/artifact-store.js';

type ShouldFetchArtifactsFromCallback = ((url: URL) => boolean) | string[];

/**
 * @hidden
 *
 * MeaningMaker binds the Artifacts components with the rest of the Perception Toolkit.
 * It provides a good set of default behaviours, but can be replaced with alternative
 * strategies in advanced cases.
 *
 * Things MeaningMaker adds in addition to just exposing `src/artficts/`:
 * * Creates a default Artifact Loader, Store, and Dealer.
 * * Automatically loads Artifacts from embedding Document on init.
 * * Attempts to index Pages when Markers are URLs.
 * * Makes sure to only index content from supported domains/URLs.
 */
export class MeaningMaker {
  private readonly artloader = new ArtifactLoader();
  private readonly artstore = new LocalArtifactStore();
  private readonly artdealer = new ArtifactDealer();

  constructor() {
    this.addArtifactStore(this.artstore);
  }

  /**
   * Load artifact content for initial set.
   */
  async init() {
    const artifacts = await this.artloader.fromElement(document, document.URL);
    this.saveArtifacts(artifacts);
  }

  addArtifactStore(store: ArtifactStore) {
    this.artdealer.addArtifactStore(store);
  }

  /**
   * Load artifact content for initial set.
   */
  async loadArtifactsFromUrl(url: URL): Promise<ARArtifact[]> {
    try {
      const artifacts = await this.artloader.fromUrl(url);
      this.saveArtifacts(artifacts);
      return artifacts;
    } catch (ex) {
      console.error(ex);
    }
    return [];
  }

  /**
   * Load artifact content from url on same origin, usually discovered from environment.
   */
  async loadArtifactsFromSupportedUrl(url: URL,
                                      shouldFetchArtifactsFrom?: ShouldFetchArtifactsFromCallback) {
    // If there's no callback provided, match to current origin.
    if (!shouldFetchArtifactsFrom) {
      shouldFetchArtifactsFrom = (url: URL) => url.origin === window.location.origin;
    } else if (Array.isArray(shouldFetchArtifactsFrom)) {
      // If an array of strings, remap it.
      const origins = shouldFetchArtifactsFrom;
      shouldFetchArtifactsFrom = (url: URL) => !!origins.find(o => o === url.origin);
    }

    if (!shouldFetchArtifactsFrom(url)) {
      return [];
    }

    return this.loadArtifactsFromUrl(url);
  }

  /*
   * Returns the full set of potential images which are worthy of detection at this moment.
   * Each DetectableImage has one unique id, and also a list of potential Media which encodes it.
   * It is up to the caller to select the correct media encoding.
   */
  async getDetectableImages(): Promise<DetectableImage[]> {
    return this.artdealer.getDetectableImages();
  }

  /*
   * Inform MeaningMaker that `marker` has been detected in camera feed.
   * `shouldFetchArtifactsFrom` is called if marker is a URL value.  If it returns `true`, MeaningMaker will index that
   * URL and extract Artifacts, if it has not already done so.
   *
   * returns `NearbyResultDelta` which can be used to update UI.
   */
  async markerFound(marker: Marker, shouldFetchArtifactsFrom?: ShouldFetchArtifactsFromCallback):
      Promise<NearbyResultDelta> {
    // If this marker is a URL, try loading artifacts from that URL
    try {
      // Attempt to convert markerValue to URL.  This will throw if markerValue isn't a valid URL.
      // Do not supply a base url argument, since we do not want to support relative URLs,
      // and because that would turn lots of normal string values into valid relative URLs.
      const url = new URL(marker.value);
      await this.loadArtifactsFromSupportedUrl(url, shouldFetchArtifactsFrom);
    } catch (_) {
      // Do nothing if this isn't a valid URL
    }

    return this.artdealer.markerFound(marker);
  }

  /*
   * Inform MeaningMaker that `marker` has been lost from camera feed.
   *
   * returns `NearbyResultDelta` which can be used to update UI.
   */
  async markerLost(marker: Marker): Promise<NearbyResultDelta> {
    return this.artdealer.markerLost(marker);
  }

  /*
   * Inform MeaningMaker that geo `coords` have changed.
   *
   * returns `NearbyResultDelta` which can be used to update UI.
   */
  async updateGeolocation(geo: GeoCoordinates): Promise<NearbyResultDelta> {
    return this.artdealer.updateGeolocation(geo);
  }

  /*
   * Inform MeaningMaker that `detectedImage` has been found in camera feed.
   *
   * returns `NearbyResultDelta` which can be used to update UI.
   */
  async imageFound(detectedImage: DetectedImage) {
    return this.artdealer.imageFound(detectedImage);
  }

  /*
   * Inform MeaningMaker that `detectedImage` has been lost from camera feed.
   *
   * returns `NearbyResultDelta` which can be used to update UI.
   */
  async imageLost(detectedImage: DetectedImage) {
    return this.artdealer.imageLost(detectedImage);
  }

  private saveArtifacts(artifacts: ARArtifact[]) {
    for (const artifact of artifacts) {
      this.artstore.addArtifact(artifact);
    }
  }
}
