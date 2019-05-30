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

/**
 * Represents the debug level for logging.
 */
export enum DEBUG_LEVEL {
  /**
   * No messages.
   */
  NONE,

  /**
   * Errors.
   */
  ERROR,

  /**
   * Warnings.
   */
  WARNING,

  /**
   * Info.
   */
  INFO,

  /**
   * All messages.
   */
  VERBOSE,
}

/**
 * Enables logging at the given level. Note: by default debugging is disabled.
 */
export function enableLogLevel(level: DEBUG_LEVEL) {
  (self as any).DEBUG = level;
}

export function enableLogLevelFromString(level: string) {
  switch (level) {
    case 'verbose': return enableLogLevel(DEBUG_LEVEL.VERBOSE);
    case 'info': return enableLogLevel(DEBUG_LEVEL.INFO);
    case 'warning': return enableLogLevel(DEBUG_LEVEL.WARNING);
    case 'error': return enableLogLevel(DEBUG_LEVEL.ERROR);
    default: return enableLogLevel(DEBUG_LEVEL.NONE);
  }
}

declare const DEBUG: DEBUG_LEVEL;

/**
 * Logs a message.
 *
 * ```javascript
 *
 * // Enable ERROR and WARNING messages.
 * enableLogLevel(DEBUG_LEVEL.WARNING);
 *
 * // Ignored.
 * log('Bar!', DEBUG_LEVEL.INFO);
 *
 * // A tagged message.
 * log('Foo!', DEBUG_LEVEL.WARNING, 'some tag');
 *
 * // A non-tagged message.
 * log('Baz!', DEBUG_LEVEL.ERROR)
 * ```
 */
export function log(msg: any, level: DEBUG_LEVEL = DEBUG_LEVEL.INFO,
                    tag?: string) {
  if (typeof DEBUG === 'undefined' || level > DEBUG) {
    return;
  }

  const label = applyTagIfProvided(level, tag);
  switch (level) {
    case DEBUG_LEVEL.ERROR:
      console.error(label, msg);
      break;

    case DEBUG_LEVEL.WARNING:
      console.warn(label, msg);
      break;

    default:
      console.log(label, msg);
      break;
  }
}

function applyTagIfProvided(label: DEBUG_LEVEL, tag?: string) {
  let labelStr = '';
  switch (label) {
    case DEBUG_LEVEL.WARNING:
      labelStr = 'WARNING';
      break;

    case DEBUG_LEVEL.ERROR:
      labelStr = 'ERROR';
      break;

    default:
      labelStr = 'INFO';
      break;
  }

  if (!tag) {
    return `${labelStr}:`;
  }

  return `${labelStr} [${tag}]:`;
}
