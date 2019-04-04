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

import { OnboardingCard } from '../src/elements/onboarding-card/onboarding-card.js';
import { fire } from '../src/utils/fire.js';
import { loadImages } from '../src/utils/load-images.js';

export async function startOnboardingProcess(images: string[]) {
  const { config } = window.PerceptionToolkit || { config: { root: '' } };
  const { root = '' } = config;
  const onboarding = new OnboardingCard({polyfillPrefix: root});
  await onboarding.ready;

  onboarding.mode = 'fade';

  const stepImages = await loadImages(images);
  for (const stepImage of stepImages) {
    // Assume each image ought to be at 50%, which is the case here because the
    // images are at 2x for high dpi screens.
    stepImage.width = stepImage.naturalWidth * 0.5;
    stepImage.height = stepImage.naturalHeight * 0.5;

    // Update the onboarding element's dimensions.
    if (onboarding.width === 0 || onboarding.height === 0) {
      onboarding.width = stepImage.width;
      onboarding.height = stepImage.height;
    }

    onboarding.appendChild(stepImage);
  }

  document.body.appendChild(onboarding);
}

window.addEventListener('keyup', (e) => {
  const card = document.activeElement as OnboardingCard;
  if (card.tagName !== OnboardingCard.defaultTagName.toUpperCase()) {
    return;
  }

  switch (e.key) {
    case ' ':
      card.next();
      break;

    case 'Escape':
      fire(OnboardingCard.onboardingFinishedEvent, card);
      break;

    default: return;
  }
});

window.addEventListener(OnboardingCard.onboardingFinishedEvent, (e) => {
  const target = e.target as OnboardingCard;
  const tagName = OnboardingCard.defaultTagName.toUpperCase();
  if (!target || target.tagName !== tagName) {
    return;
  }

  target.remove();
  document.body.focus();
});

// Register the card element, and start the process.
customElements.define(OnboardingCard.defaultTagName, OnboardingCard);
