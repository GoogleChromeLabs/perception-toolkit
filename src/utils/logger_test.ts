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
  let consoleInfoSpy: sinon.SinonSpy;
  let consoleWarnSpy: sinon.SinonSpy;
  let consoleErrorSpy: sinon.SinonSpy;
  beforeEach(() => {
    enableLogLevel(DEBUG_LEVEL.NONE);
    consoleInfoSpy = spy(console, 'log');
    consoleWarnSpy = spy(console, 'warn');
    consoleErrorSpy = spy(console, 'error');
  });

  afterEach(() => {
    enableLogLevel(DEBUG_LEVEL.NONE);
    consoleInfoSpy.restore();
    consoleWarnSpy.restore();
    consoleErrorSpy.restore();
  });

  it('ignores logs at NONE', async () => {
    enableLogLevel(DEBUG_LEVEL.NONE);
    log('unset or NONE enabled - log at error - expect no output', DEBUG_LEVEL.ERROR);
    assert.isFalse(consoleInfoSpy.called);
    assert.isFalse(consoleWarnSpy.called);
    assert.isFalse(consoleErrorSpy.called);
  });

  it('observes the correct logging level', async () => {
    enableLogLevel(DEBUG_LEVEL.WARNING);
    log('enabled at warning - log at error', DEBUG_LEVEL.ERROR);
    log('enabled at warning - log at warning', DEBUG_LEVEL.WARNING);
    log('enabled at warning - log at info - should not print', DEBUG_LEVEL.INFO);
    assert.isFalse(consoleInfoSpy.called);
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
    assert.isTrue(consoleInfoSpy.called, 'Info was not called');
    assert.isTrue(consoleWarnSpy.called, 'Warn was not called');
    assert.isTrue(consoleErrorSpy.called, 'Error was not called');
  });

  it('does not tag the message', async () => {
    enableLogLevel(DEBUG_LEVEL.INFO);
    log('foo', DEBUG_LEVEL.INFO);
    assert.isTrue(consoleInfoSpy.withArgs('INFO:', 'foo').calledOnce);
  });

  it('tags the message', async () => {
    enableLogLevel(DEBUG_LEVEL.INFO);
    log('tagged message', DEBUG_LEVEL.INFO, 'tag for a message');
    assert.isTrue(consoleInfoSpy.withArgs('INFO [tag for a message]:', 'tagged message').calledOnce);
  });
});
