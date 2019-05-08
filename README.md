# Perception Toolkit

<p align="center">
<img alt="Perception Toolkit running on a phone" src="https://github.com/PolymerLabs/perception-toolkit/raw/master/assets/framed.jpg">
</p>

This toolkit provides a set of components and utilities for developers to add an augmented experience to their website. For example, a primary use-case supported is the ability to detect barcodes (in -- say -- a real-world store) with the user's device camera, and to show them extended information on a given product.

Included in this toolkit is:

* Device Support Detection
  * Barcode Detector
  * getUserMedia and environment camera
  * Geolocation
  * Wasm
* Detectors
  * Barcode Detector (native / ZXing)
  * QR Codes (native / ZXing)
  * Geolocation (native)
  * (TODO) Planar Image
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

We recommend installation via [npm](https://npmjs.com). Simply:

```
npm install --save perception-toolkit
```

The intended use is detailed under `demo/`, where you can see how to set up barcode detection and the display of values to the end user. A good starting point is `demo/simple/index.html`, with a few small modifications to refer to `node_modules` (and assuming that `node_modules` is available at the root of your server, as it is with our sample server):

* You must specify `root` in `window.PerceptionToolkit.config`:

  ```
  window.PerceptionToolkit.config = {
    root: '/node_modules/perception-toolkit',
    
    ...
  }
  ```

* You must change the location of `bootstrap.js`, included at the end of
  `index.html`:
  
  ```
  <script src="/node_modules/perception-toolkit/lib/bundled/bootstrap.js"></script>
  ```


## Development

1. `git clone https://github.com/PolymerLabs/perception-toolkit`
1. `npm i`
1. `npm run build`
1. `npm run serve`
1. [Open the demo page at localhost:8080](http://localhost:8080)

## Building

`npm run build`

## Testing

`npm test`

_Note:_ coverage data can be found in the generated `coverage/` directory located in the project root.

## API Docs

`npm run docs`

_Note:_ docs can be found in the generated `docs` directory located in the project root.
