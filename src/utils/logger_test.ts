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

const { assert } = chai;

import { spy } from 'sinon';
import { DEBUG_LEVEL, enableLogLevel, log, enableLogLevelFromString } from './logger.js';

describe('log', () => {
  let consoleLogSpy: sinon.SinonSpy;
  let consoleWarnSpy: sinon.SinonSpy;
  let consoleErrorSpy: sinon.SinonSpy;
  beforeEach(() => {
    enableLogLevel(DEBUG_LEVEL.NONE);
    consoleLogSpy = spy(console, 'log');
    consoleWarnSpy = spy(console, 'warn');
    consoleErrorSpy = spy(console, 'error');
  });

  afterEach(() => {
    enableLogLevel(DEBUG_LEVEL.NONE);
    consoleLogSpy.restore();
    consoleWarnSpy.restore();
    consoleErrorSpy.restore();
  });

  it('ignores logs by default', async () => {
    log('foo', DEBUG_LEVEL.ERROR);
    assert.isFalse(consoleLogSpy.called);
    assert.isFalse(consoleWarnSpy.called);
    assert.isFalse(consoleErrorSpy.called);
  });

  it('observes the correct logging level', async () => {
    enableLogLevel(DEBUG_LEVEL.WARNING);
    log('foo', DEBUG_LEVEL.ERROR);
    log('foo', DEBUG_LEVEL.WARNING);
    log('foo', DEBUG_LEVEL.INFO);
    assert.isFalse(consoleLogSpy.called);
    assert.isTrue(consoleWarnSpy.called);
    assert.isTrue(consoleErrorSpy.called);
  });

  it('logs based on string vals', async () => {
    const getDebugLevel = () => (self as any).DEBUG;

    enableLogLevelFromString('warning');
    assert.equal(getDebugLevel(), DEBUG_LEVEL.WARNING);

    enableLogLevelFromString('info');
    assert.equal(getDebugLevel(), DEBUG_LEVEL.INFO);

    enableLogLevelFromString('error');
    assert.equal(getDebugLevel(), DEBUG_LEVEL.ERROR);

    enableLogLevelFromString('verbose');
    assert.equal(getDebugLevel(), DEBUG_LEVEL.VERBOSE);

    enableLogLevelFromString('none');
    assert.equal(getDebugLevel(), DEBUG_LEVEL.NONE);

    // Invalid strings should result in NONE.
    enableLogLevelFromString('foo');
    assert.equal(getDebugLevel(), DEBUG_LEVEL.NONE);
  });

  it('is verbose', async () => {
    enableLogLevel(DEBUG_LEVEL.VERBOSE);
    log('foo', DEBUG_LEVEL.INFO);
    log('foo', DEBUG_LEVEL.WARNING);
    log('foo', DEBUG_LEVEL.ERROR);
    assert.isTrue(consoleLogSpy.called, 'Info was not called');
    assert.isTrue(consoleWarnSpy.called, 'Warn was not called');
    assert.isTrue(consoleErrorSpy.called, 'Error was not called');
  });

  it('does not tag the message', async () => {
    enableLogLevel(DEBUG_LEVEL.INFO);
    log('foo', DEBUG_LEVEL.INFO);
    assert.isTrue(consoleLogSpy.withArgs('INFO:', 'foo').calledOnce);
  });

  it('tags the message', async () => {
    enableLogLevel(DEBUG_LEVEL.INFO);
    log('foo', DEBUG_LEVEL.INFO, 'bar');
    assert.isTrue(consoleLogSpy.withArgs('INFO [bar]:', 'foo').calledOnce);
  });
});
