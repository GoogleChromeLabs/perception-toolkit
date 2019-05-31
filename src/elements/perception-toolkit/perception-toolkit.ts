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

import { html, styles } from './perception-toolkit.template.js';

import { Marker } from '../../../defs/marker.js';
import {
  PerceptionToolkitConfig,
  PerceptionToolkitElements,
  PerceptionToolkitEvents,
  PerceptionToolkitFunctions,
} from '../../../perception-toolkit/defs.js';
import { NearbyResult, NearbyResultDelta } from '../../artifacts/artifact-dealer.js';
import { detectBarcodes } from '../../detectors/marker/barcode.js';
import { addDetectionTarget, detectPlanarImages, getTarget } from '../../detectors/planar-image/planar-image.js';
import { cameraAccessDenied, captureClosed, captureFrame, markerDetect, perceivedResults } from '../../events.js';
import { observeConnectivityChanges, unobserveConnectivityChanges} from '../../utils/connectivity-changed.js';
import { supportsEnvironmentCamera } from '../../utils/environment-camera.js';
import { fire } from '../../utils/fire.js';
import { flat } from '../../utils/flat.js';
import { DEBUG_LEVEL, log } from '../../utils/logger.js';
import { vibrate } from '../../utils/vibrate.js';
import { ActionButton } from '../action-button/action-button.js';
import { Card, CardData } from '../card/card.js';
import { DotLoader } from '../dot-loader/dot-loader.js';
import { MeaningMaker } from '../meaning-maker/meaning-maker.js';
import { OnboardingCard } from '../onboarding-card/onboarding-card.js';
import { hideOverlay, showOverlay } from '../overlay/overlay.js';
import { StreamCapture } from '../stream-capture/stream-capture.js';

window.PerceptionToolkit = window.PerceptionToolkit || {
  Elements: {} as PerceptionToolkitElements,
  Events: {} as PerceptionToolkitEvents,
  Functions: {} as PerceptionToolkitFunctions,
  config: {} as PerceptionToolkitConfig,
};

const {
  acknowledgeUnknownItems = true,
  artifactSources = [],
  cardContainer,
  cardUrlLabel = 'View Details',
  cardMainEntityLabel = 'Launch',
  cardShouldLaunchNewWindow = false,
  detectionMode = 'passive',
  detectors = 'lazy',
  hintTimeout = 10000,
  maxCards = 1,
  root = ''
} = window.PerceptionToolkit.config;

/**
 * Perception Toolkit
 */
export class PerceptionToolkit extends HTMLElement {
  /**
   * The default tag name for registering with
   * `customElements.define`.
   */
  static defaultTagName = 'perception-toolkit';

  private static get STREAM_OPTS() {
    return {
      video: {
        facingMode: 'environment'
      }
    };
  }

  private readonly root = this.attachShadow({ mode: 'open' });
  private readonly meaningMaker = new MeaningMaker();
  private readonly detectedTargets = new Map<{type: string, value: string}, number>();
  private readonly onVisibilityChangeBound = this.onVisibilityChange.bind(this);
  private readonly onMarkerFoundBound = this.onMarkerFound.bind(this);
  private readonly onCaptureFrameBound = this.onCaptureFrame.bind(this);
  private readonly onCloseBound = this.onClose.bind(this);
  private readonly startupDetections: Array<Promise<Marker[]>> = [];
  private readonly detectorsToUse = {
    barcode: true,
    image: false
  };
  private capture!: StreamCapture;
  private stream!: MediaStream;
  private isRequestingNewStream = false;
  private isProcessingFrame = false;
  private hintTimeoutId = -1;

  /* istanbul ignore next */
  constructor() {
    super();

    this.initializeDetectors();
  }

  /**
   * @ignore Only public because it's a Custom Element.
   */
  connectedCallback() {
    this.root.innerHTML = `<style>${styles}</style> ${html}`;
    this.capture =
        this.root.querySelector(StreamCapture.defaultTagName) as StreamCapture;

    if (!this.capture) {
      log('Unable to obtain capture element', DEBUG_LEVEL.ERROR);
    }

    this.addEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  async start() {
    await this.meaningMaker.init();
    await this.loadArtifactSources();
    await this.onboardingComplete();
    await this.beginDetection();

    observeConnectivityChanges();
  }

  stop() {
    // Stop and hide the capture.
    this.capture.classList.remove('active');
    this.capture.stop();

    // Clear any markers.
    this.detectedTargets.clear();

    unobserveConnectivityChanges();
    hideOverlay();
    clearTimeout(this.hintTimeoutId);

    const onboarding = document.querySelector(OnboardingCard.defaultTagName);
    if (onboarding) {
      onboarding.remove();
    }
  }

  private onClose() {
    this.stop();
  }

  private addEventListeners() {
    window.addEventListener('visibilitychange', this.onVisibilityChangeBound);
    this.addEventListener(captureFrame, this.onCaptureFrameBound);
    this.addEventListener(captureClosed, this.onCloseBound);
    this.addEventListener(markerDetect, this.onMarkerFoundBound);
  }

  private removeEventListeners() {
    window.removeEventListener('visibilitychange', this.onVisibilityChangeBound);
    this.removeEventListener(captureFrame, this.onCaptureFrameBound);
    this.removeEventListener(captureClosed, this.onCloseBound);
    this.removeEventListener(markerDetect, this.onMarkerFoundBound);
  }

  private async purgeOldMarkers() {
    const now = self.performance.now();
    const removals = [];
    for (const [marker, timeLastSeen] of this.detectedTargets.entries()) {
      // Any targets seen in the last second should remain.
      if (now - timeLastSeen < 1000) {
        continue;
      }

      // All others need removing.
      switch (marker.type) {
        case 'ARImageTarget':
          const image = await getTarget(marker.value);
          if (!image) {
            break;
          }

          removals.push(this.meaningMaker.imageLost(image));
          break;

        default:
          removals.push(this.meaningMaker.markerLost(marker));
          break;
      }

      this.detectedTargets.delete(marker);
    }

    // Wait for all dealer removals to conclude.
    await Promise.all(removals);
  }

  private initializeDetectors() {
    const label = 'Perception Toolkit';
    const attemptData = new ImageData(640, 480);
    if (!detectors || detectors === 'lazy') {
      log('Loading detectors (lazy)', DEBUG_LEVEL.INFO, label);
      this.startupDetections.push(detectBarcodes(attemptData, { root }));
      return;
    }

    // Load all detectors.
    if (detectors === 'all') {
      log('Loading detectors (all)', DEBUG_LEVEL.INFO, label);

      this.startupDetections.push(detectBarcodes(attemptData, { root }));
      this.startupDetections.push(detectPlanarImages(attemptData, { root }));
      this.detectorsToUse.barcode = true;
      this.detectorsToUse.image = true;
      return;
    }

    // Work on a case-by-case basis instead.
    for (const [detectorName, detector] of Object.entries(detectors)) {
      if (detector === 'lazy' || !detector) {
        log(`Loading ${detectorName} (lazy)`, DEBUG_LEVEL.INFO, label);
        continue;
      }

      log(`Loading ${detectorName} (full)`, DEBUG_LEVEL.INFO, label);
      switch (detectorName) {
        case 'barcode':
          this.startupDetections.push(detectBarcodes(attemptData, { root }));
          this.detectorsToUse.barcode = true;
          break;

        case 'image':
          this.startupDetections.push(detectPlanarImages(attemptData, { root }));
          this.detectorsToUse.image = true;
          break;
      }
    }
  }

  private async loadArtifactSources() {
    if (!artifactSources) {
      return;
    }

    // TODO: Move this to a config manager.
    let sources: string | string[] = artifactSources;
    if (!Array.isArray(sources)) {
      sources = [artifactSources as unknown as string];
    }

    const load = sources.map((url) => {
      return this.meaningMaker.loadArtifactsFromUrl(new URL(url, document.URL));
    });

    await Promise.all(load);
  }

  private async onboardingComplete() {
    const onboarding = document.querySelector(OnboardingCard.defaultTagName);
    if (!onboarding) {
      return;
    }

    return new Promise((resolve) => {
      // When onboarding is finished, start the stream and remove the loader.
      onboarding.addEventListener(OnboardingCard.onboardingFinishedEvent, () => {
        onboarding.remove();
        resolve();
      });
    });
  }

  private async beginDetection() {
    try {
      // Stream.
      await this.initializeStreamCapture();

      // Detectors.
      const overlayInit = { id: 'pt.detectors', small: true };
      showOverlay('Initializing detectors...', overlayInit);
      await Promise.all(this.startupDetections);
      hideOverlay(overlayInit);

      // Image targets.
      if (this.detectorsToUse.image || detectors === 'lazy' ||
          detectors === 'all') {
        await this.loadImageTargets();
      }
      this.hideLoaderIfNeeded();
    } catch (e) {
      log(e.message, DEBUG_LEVEL.ERROR, 'Detection');
    }
  }

  private async loadImageTargets() {
    const detectableImages = await this.meaningMaker.getDetectableImages();
    if (detectableImages.length === 0) {
      return;
    }

    const overlayInit = { id: 'pt.imagetargets', small: true };
    showOverlay('Obtaining image targets...', overlayInit);

    // Enable detection for any targets.
    let imageCount = 0;
    for (const image of detectableImages) {
      for (const media of image.media) {
        // If the object does not match our requirements, bail.
        if (!media['@type'] || media['@type'] !== 'MediaObject' ||
            !media.contentUrl || !media.encodingFormat ||
            media.encodingFormat !== 'application/octet+pd') {
          continue;
        }

        const url = media.contentUrl.toString();
        log(`Loading ${url}`, DEBUG_LEVEL.VERBOSE);

        // Obtain a Uint8Array for the file.
        try {
          const bytes = await fetch(url, { credentials: 'include' })
              .then(r => r.arrayBuffer())
              .then(b => new Uint8Array(b));

          // Switch on detection.
          log(`Adding detection target: ${image.id}`);
          addDetectionTarget(bytes, image);
          imageCount++;
        } catch (e) {
          log(`Unable to load ${url}`, DEBUG_LEVEL.WARNING);
        }
      }
    }

    hideOverlay(overlayInit);
    log(`${imageCount} target(s) added`, DEBUG_LEVEL.INFO);

    // Declare the detector ready to use.
    this.detectorsToUse.image = true;
  }

  private hideLoaderIfNeeded() {
    const loader = document.querySelector(DotLoader.defaultTagName);
    if (!loader) {
      return;
    }

    loader.remove();
  }

  private async initializeStreamCapture() {
    log(`Starting detection: ${detectionMode}`, DEBUG_LEVEL.INFO,
        'Perception Toolkit');

    // Attempt to get access to the user's camera.
    try {
      this.stream =
          await navigator.mediaDevices.getUserMedia(PerceptionToolkit.STREAM_OPTS);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasEnvCamera = await supportsEnvironmentCamera(devices);
      this.capture.flipped = !hasEnvCamera;
      this.capture.classList.add('active');
      this.capture.start(this.stream);
      this.configureCaptureMode();

      this.hintTimeoutId = setTimeout(() => {
        showOverlay('Make sure the marker is inside the box.');
      }, hintTimeout) as unknown as number;
    } catch (e) {
      // User has denied or there are no cameras.
      fire(cameraAccessDenied, window);
    }
  }

  private configureCaptureMode() {
    // Helper function for the different modes.
    const captureAndEmit = async () => {
      const imgData = await this.capture.captureFrame();
      fire(captureFrame, this.capture, {imgData, detectionMode});
    };

    switch (detectionMode) {
      case 'active':
        this.capture.addEventListener('click', async () => {
          this.capture.paused = true;
          showOverlay('Processing...');
          await captureAndEmit();
        });
        break;

      case 'burst':
        const burst = async () => {
          await captureAndEmit();
          requestAnimationFrame(burst);
        };
        requestAnimationFrame(burst);
        break;

      default:  // passive
        this.capture.captureRate = 400;
        break;
    }
  }

  private async onVisibilityChange() {
    if (this.isRequestingNewStream || !this.capture) {
      return;
    }

    if (document.hidden) {
      this.capture.stop();
      return;
    }

    // Block multiple requests for a new stream.
    this.isRequestingNewStream = true;
    this.stream =
        await navigator.mediaDevices.getUserMedia(PerceptionToolkit.STREAM_OPTS);
    this.isRequestingNewStream = false;

    // Bail if the document is hidden again.
    if (document.hidden) {
      return;
    }

    // Ensure the capture is definitely stopped before starting a new one.
    this.capture.stop();
    this.capture.start(this.stream);
  }

  private async onCaptureFrame(evt: Event) {
    // Lock until the frame has been processed.
    if (this.isProcessingFrame) {
      return;
    }
    this.isProcessingFrame = true;
    const frameEvt = evt as CustomEvent<{imgData: ImageData}>;
    const { imgData } = frameEvt.detail;

    // Only use detectors that we explicitly ask to run.
    // This is set in the config, under `detectors`.
    const detectionTasks = [];
    if (this.detectorsToUse.barcode) {
      detectionTasks.push(detectBarcodes(imgData, { root }));
    }

    if (this.detectorsToUse.image) {
      detectionTasks.push(detectPlanarImages(imgData, { root }));
    }

    const detectorOutcomes = await Promise.all(detectionTasks);
    const targets = flat(detectorOutcomes, 1) as Marker[];
    for (const target of targets) {
      const targetAlreadyDetected = this.detectedTargets.has(target);

      // Update the last time this marker was seen.
      this.detectedTargets.set(target, self.performance.now());
      if (targetAlreadyDetected) {
        continue;
      }

      log(target.value, DEBUG_LEVEL.INFO, 'Detect');

      // Only fire the event if the marker is freshly detected.
      fire(markerDetect, this, target);
    }

    // Unlock!
    this.isProcessingFrame = false;
    this.purgeOldMarkers();
  }

  private async onMarkerFound(evt: Event) {
    clearTimeout(this.hintTimeoutId);
    hideOverlay();

    const marker = (evt as CustomEvent<Marker>).detail;
    const { value, type } = marker;
    const { shouldLoadArtifactsFrom } = window.PerceptionToolkit.config;

    const lost: NearbyResult[] = [];
    const found: NearbyResult[] = [];
    switch (type) {
      case 'ARImageTarget':
        const image = await getTarget(value);
        if (!image) {
          break;
        }

        const imageDiff = await this.meaningMaker.imageFound(image);
        lost.push(...imageDiff.lost);
        found.push(...imageDiff.found);
        break;

      default:
        const markerDiff =
            await this.meaningMaker.markerFound(marker, shouldLoadArtifactsFrom);
        lost.push(...markerDiff.lost);
        found.push(...markerDiff.found);
        break;
    }
    const contentDiff = { lost, found };
    const markerChangeEvt = fire(perceivedResults, this, contentDiff);

    // If the developer prevents default on the marker changes event then don't
    // handle the UI updates; they're doing it themselves.
    if (markerChangeEvt.defaultPrevented) {
      return;
    }

    vibrate(200);
    this.updateContentDisplay(contentDiff, marker);
  }

  private updateContentDisplay(contentDiff: NearbyResultDelta, marker: Marker) {
    if (!cardContainer) {
      log(`No card container provided, but event's default was not prevented`,
          DEBUG_LEVEL.ERROR);
      return;
    }

    this.handleUnknownItems(contentDiff, marker);
    this.removeUnknownItemsIfFound(contentDiff);
    this.createCardsForFoundItems(contentDiff);
  }

  private handleUnknownItems(contentDiff: NearbyResultDelta, marker: Marker) {
    if (!cardContainer ||  // No card container.
        !acknowledgeUnknownItems ||  // The config says to ignore unknowns.
        contentDiff.found.length > 0 ||  // There are found items.
        contentDiff.lost.length > 0 ||  // There are lost items.
        cardContainer.childNodes.length >= maxCards) {
      return;
    }

    const card = new Card();
    card.src = `Unknown value: ${marker.value}`;
    card.classList.add('item-not-known');
    cardContainer.appendChild(card);
    return;
  }

  // Remove 'unknown item' cards if there is now a found item.
  private removeUnknownItemsIfFound(contentDiff: NearbyResultDelta) {
    if (!cardContainer || contentDiff.found.length === 0) {
      return;
    }

    const notKnown = cardContainer.querySelectorAll('.item-not-known');
    for (const card of notKnown) {
      card.remove();
    }
  }

  private createCardsForFoundItems(contentDiff: NearbyResultDelta) {
    if (!cardContainer) {
      return;
    }

    // Create a card for every found marker.
    for (const { content } of contentDiff.found) {
      // Prevent multiple cards from showing.
      if (cardContainer.childNodes.length >= maxCards) {
        continue;
      }

      const cardContent = content as CardData;
      const card = new Card();
      card.src = cardContent;
      cardContainer.appendChild(card);

      // Action Button: View Details.
      if (typeof cardContent.url !== 'undefined') {
        const viewDetails = createActionButton({
          label: cardUrlLabel || 'View Details',
          newWindow: cardShouldLaunchNewWindow,
          url: cardContent.url,
        });

        card.appendChild(viewDetails);
      }

      // Action Button: Launch.
      if (typeof cardContent.mainEntity !== 'undefined' &&
          typeof cardContent.mainEntity.url !== 'undefined') {
        const launch = createActionButton({
          label: cardMainEntityLabel || 'Launch',
          newWindow: cardShouldLaunchNewWindow,
          url: cardContent.mainEntity.url,
        });

        card.appendChild(launch);
      }
    }
  }
}

function createActionButton({
                              url = '',
                              label = '',
                              newWindow = false
                            }) {

  if (!url) {
    throw new Error('Unable to create button; no URL provided');
  }

  const callback = newWindow ?
      () => window.open(url) :
      () => window.location.href = url;

  const button = new ActionButton();
  button.label = label;
  button.addEventListener('click', callback);
  return button;
}
