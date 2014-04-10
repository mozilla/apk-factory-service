/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function(log, context, err) {
  if (err.stack) {
    log.error(context + ' [' + err.stack.toString() + ']');
  } else {
    log.error(context + ' [' + err.toString() + ']');
  }
};