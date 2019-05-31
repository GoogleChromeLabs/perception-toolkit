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

const debug = true;

module.exports = function(config) {
  const options = {
    basePath: "",

    files: [
      'node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js',
      {
        pattern: 'lib/polyfills/**/*.js',
        included: false,
        served: true,
      },
      {
        pattern: 'test-assets/**/*.html',
        included: false,
        served: true,
      },
      {
        pattern: 'third_party/**/*.js',
        included: false,
        served: true,
      },
      {
        pattern: '**/*.wasm',
        included: false,
        served: true,
        type: 'wasm'
      },
      {
        pattern: 'src/**/*.ts'
      }
    ],

    proxies: {
      '/third_party': '/base/third_party',
      '/lib': '/base/lib'
    },

    exclude: [],

    reporters: ["dots", "karma-typescript"],

    preprocessors: {
      'src/**/*.ts': ['karma-typescript']
    },

    frameworks: ["detectBrowsers", "mocha", "chai", "sinon", "karma-typescript"],

    karmaTypescriptConfig: {
      compilerOptions: {
        lib: ['dom', 'dom.iterable', 'esnext', 'esnext.array'],
        downlevelIteration: true,
      },

      exclude: [
        "lib"
      ],

      coverageOptions: {
        exclude: [/_test.tsx?$/, /worker.ts/, /vibrate.ts/, /speech.ts/]
      }
    },

    detectBrowsers: {
      postDetection(availableBrowsers) {
        const rapidTestingMode = debug;

        const browsers = ["ChromeHeadless"];

        if (!rapidTestingMode && availableBrowsers.includes("Safari")) {
          browsers.push("Safari");
        }

        if (!rapidTestingMode && availableBrowsers.includes("Firefox")) {
          browsers.push("Firefox");
        }

        return browsers;
      }
    },

    plugins: [
      "karma-chrome-launcher",
      "karma-firefox-launcher",
      "karma-safari-launcher",
      "karma-detect-browsers",
      "karma-mocha",
      "karma-chai",
      "karma-sinon",
      "karma-typescript"
    ],

    mime: {
      'application/wasm': ['wasm']
    },

    singleRun: !debug
  };

  config.set(options);
};
