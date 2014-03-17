/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var crypto = require('crypto');

module.exports = function(text) {
  var sha = crypto.createHash('sha1');
  sha.update(text);
  return sha.digest('hex');
};