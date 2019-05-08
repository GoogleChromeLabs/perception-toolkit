# Web Perception Toolkit

<p align="center">
<img alt="Web Perception Toolkit running on a phone" src="https://github.com/PolymerLabs/perception-toolkit/raw/master/assets/framed.jpg">
</p>

This toolkit provides a set of components and utilities for developers to add an augmented experience to their website. For example, a primary use-case supported is the ability to detect barcodes (in -- say -- a real-world store) with the user's device camera, and to show them extended information on a given product.

Please see our [Getting Started](https://perceptiontoolkit.dev/getting-started/) guide.

## Overview

Included in this toolkit:

* Device Support Detection
  * Barcode Detector
  * getUserMedia and environment camera
  * Geolocation
  * Wasm
* Detectors
  * Barcode Detector (native / [ZXing](https://github.com/zxing))
  * QR Codes (native / [ZXing](https://github.com/zxing))
  * Geolocation (native)
  * 2D (Planar) Images
  * (TODO) ML Image Classification
* UI
  * Loader
  * Card
  * User onboarding
* Utilities
  * Stream capture (i.e. `getUserMedia` to image conversion)
  * Logging
  * Image resizing

## Installation

Please check out our [Getting Started](https://perceptiontoolkit.dev/getting-started/) guide for far more information.

Briefly, however: we recommend installation via [npm](https://npmjs.com). Simply:

```
npm install --save perception-toolkit
```

A few starting samples are under [demo](https://github.com/GoogleChromeLabs/perception-toolkit/tree/master/demo), where you can see how to set up barcode detection and the display of values to the end user. The most basic is [demo/simple](https://github.com/GoogleChromeLabs/perception-toolkit/tree/master/demo/simple), and this may be a good starting point in your own project. Once you copy [demo/simple/index.html](https://github.com/GoogleChromeLabs/perception-toolkit/blob/master/demo/simple/index.html) into your own project, you'll need a few small modifications to refer to the Web Perception Toolkit installed in `node_modules` (and assuming that `node_modules` is available at the root of your server, as it is with our sample server):

* You must specify `root` in the existing `window.PerceptionToolkit.config`:

  ```
  window.PerceptionToolkit.config = {
    root: '/node_modules/perception-toolkit',
    
    ...
  }
  ```

* You must change the location of `bootstrap.js` (included at the end of
  `<body>`):
  
  ```
  <script src="/node_modules/perception-toolkit/lib/bundled/bootstrap.js"></script>
  ```


## Development

We're glad you're excited and want to help out! Please read our [contributing](CONTRIBUTING.md) guide for hints.

1. `git clone https://github.com/GoogleChromeLabs/perception-toolkit`
1. `npm i`
1. `npm run build`
1. `npm run serve`
1. [Open the demo page at localhost:8080](http://localhost:8080)

## Testing

`npm test`

_Note:_ coverage data can be found in the generated `coverage/` directory located in the project root.

## API Docs

`npm run docs`

_Note:_ docs can be found in the generated `docs` directory located in the project root.
