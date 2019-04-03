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

import typescript from 'rollup-plugin-typescript2';
import loadz0r from './build/dynamic-loader/index.js';
import { terser } from 'rollup-plugin-terser';

export default [{
  input: [
    'perception-toolkit/bootstrap.ts',
    'perception-toolkit/loader.ts',
    'perception-toolkit/main.ts',
    'perception-toolkit/meaning-maker.ts',
    'perception-toolkit/onboarding.ts',
  ],
  plugins: [
    typescript({
      target: 'es2015',
      module: 'esnext',
      tsconfigOverride: {
        compilerOptions: {
          declaration: false
        }
      }
    }),
    loadz0r({
      publicPath: function() {
        let root = '';
        if (window.PerceptionToolkit &&
            window.PerceptionToolkit.config &&
            window.PerceptionToolkit.config.root) {
          root = window.PerceptionToolkit.config.root
        }
        return `${root}/lib/bundled`;
      }
    }),
    terser()
  ],

  output: {
    dir: 'lib/bundled',
    format: 'amd',
    exports: 'named',
    chunkFileNames: 'pt-chunk-[hash].js'
  }
}];
