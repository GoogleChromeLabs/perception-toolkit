/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
declare global {
    interface Window {
        idbKeyval: {
            set(name: string, value: any): Promise<void>;
            get(name: string): Promise<{}>;
        };
        PerceptionToolkit: {
            config: {
                root?: string;
                onboarding?: boolean;
                onboardingImages?: string[];
                button?: HTMLElement;
                buttonSelector?: string;
                buttonVisibilityClass?: string;
                hintTimeout?: number;
                detectionMode?: 'active' | 'passive';
                showLoaderDuringBoot?: boolean;
            };
            loader: {
                hideLoader(): void;
                showLoader(): void;
            };
            main: {
                initialize(detectionMode?: 'active' | 'passive'): void;
            };
            onboarding: {
                startOnboardingProcess(images: string[]): Promise<void>;
            };
        };
    }
}
/**
 * Initialize the experience.
 */
export declare function initializeExperience(): Promise<void>;
