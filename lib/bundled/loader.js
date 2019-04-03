/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

if(!self.perceptionToolkitLoader){const o=async o=>{if(!t[o]&&(await new Promise(async e=>{if("document"in self){const t=document.createElement("script");t.src=function(){let o="";return window.PerceptionToolkit&&window.PerceptionToolkit.config&&window.PerceptionToolkit.config.root&&(o=window.PerceptionToolkit.config.root),`${o}/lib/bundled`}()+o.slice(1),t.defer=!0,document.head.appendChild(t),t.onload=e}else importScripts(o),e()}),!t[o]))throw new Error(`Module ${o} didn’t register its module`);return t[o]},e=async(e,t)=>{const i=await Promise.all(e.map(o));t(1===i.length?i[0]:i)},t={require:Promise.resolve(e)};self.perceptionToolkitLoader=((e,i,n)=>{t[e]||(t[e]=new Promise(async e=>{let t={};const r={uri:location.origin+function(){let o="";return window.PerceptionToolkit&&window.PerceptionToolkit.config&&window.PerceptionToolkit.config.root&&(o=window.PerceptionToolkit.config.root),`${o}/lib/bundled`}()+name.slice(1)},c=await Promise.all(i.map(e=>"exports"===e?t:"module"===e?r:o(e))),d=n(...c);t.default||(t.default=d),e(t)}))})}perceptionToolkitLoader("./loader.js",["exports","./pt-chunk-d3dcaf5d.js"],function(o,e){"use strict";customElements.define(e.DotLoader.defaultTagName,e.DotLoader);const t=new e.DotLoader;t.style.setProperty("--color","#FFF"),o.hideLoader=function(){t.remove()},o.showLoader=function(){document.body.appendChild(t)},Object.defineProperty(o,"__esModule",{value:!0})});
