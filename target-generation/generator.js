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

const imageDecode = require('image-decode');
const glob = require('glob').Glob;
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const { files, dest, verbose } = require('yargs')
    .option('files', {
      alias: 'f'
    })
    .option('dest', {
      alias: 'd',
      default: './targets'
    })
    .option('verbose', {
      alias: 'v',
      default: false,
      type: 'boolean'
    })
    .argv;

if (!files) {
  console.error('Must provide files');
  process.exit(1);
}

if (!dest) {
  console.error('Must provide a dest path');
  process.exit(1);
}

function log(msg) {
  if (!verbose) {
    return;
  }

  console.log(msg);
}

log('Generating [Verbose]');
const srcPath = path.isAbsolute(files) ? files : path.join(__dirname, files);

/*
 * Start by searching through the files given.
 */
glob(srcPath, {}, async (err, srcFiles) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const PlanarTargetUtility = require('./planar-target-indexer-loader.js');
  const mod = PlanarTargetUtility({
    locateFile(url) {
      if (url.endsWith('.wasm')) {
        return path.resolve(__dirname, `../third_party/planar-image/${url}`);
      }

      return url;
    },

    onRuntimeInitialized() {
      // Reassign the global module.
      global.Module = mod;

      const PlanarTargetIndexer = require('./planar-target-indexer-utility.js');
      const indexer = new PlanarTargetIndexer();

      log(`Creating targets`);

      let count = 0;
      const files = srcFiles.map((file) => {
        const id = count++;
        const imageData = imageDecode(fs.readFileSync(file));
        indexer.processImageFrame(imageData, id);
        const result = indexer.extractIndex();
        const fileName = path.parse(file).name;
        return {
          name: `${fileName}.pb`,
          data: result.blobData
        }
      });

      for (const file of files) {
        const filePath = path.resolve(__dirname, dest, file.name);
        const dirPath = path.dirname(filePath);
        mkdirp(dirPath);
        fs.writeFileSync(filePath, file.data);
      }

      log(`Target generation finished - created ${count} file(s)`);
    }

  });
});

