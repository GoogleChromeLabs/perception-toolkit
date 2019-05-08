# Perception Toolkit

 [![Build Status](https://api.travis-ci.org/GoogleChromeLabs/perception-toolkit.svg?branch=master)](https://travis-ci.org/GoogleChromeLabs/perception-toolkit)
 [![NPM](https://img.shields.io/npm/v/perception-toolkit.svg)](https://www.npmjs.com/package/perception-toolkit)

This toolkit provides a set of components and utilities for developers to add an
augmented experience to their website. For example, a primary use-case supported
is the ability to detect barcodes (in -- say -- a real-world store) with the
user's device camera, and to show them extended information on a given product.

Included in this toolkit is:

* Support detection
  * Barcodes
  * getUserMedia and environment camera
  * Geolocation
* Detectors
  * Barcodes
  * QR Codes
  * Geolocation
  * (TODO) Planar Image / ML Image Classification
* UI
  * Loader
  * Card
  * User onboarding
* Utilities
  * Stream capture (i.e. `getUserMedia` to image conversion)
  * Logging
  * Image resizing

## Getting started

1. `git clone https://github.com/GoogleChromeLabs/perception-toolkit`
1. `npm i`
1. `npm run build`
1. `npm run serve`
1. [Open the demo page at localhost:8080](http://localhost:8080)

The intended use is detailed under `src/recipes`, where you can see how to set
up barcode detection and the display of values to the end user.

**Please note:** You will need to use Chrome 73+ for the native BarcodeDetector,
and should enable Experimental Web Platform features.

## Building

`npm run build`

## Testing

`npm test`

_Note:_ coverage data can be found in the generated `coverage` folder located in
the project root.

## API Docs

`npm run docs`

_Note:_ docs can be found in the generated `docs` folder located in
the project root.
