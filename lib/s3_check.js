/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var s3 = require('./s3');

module.exports = function(cb) {
  s3.checkBucket(function(res) {
    if (200 === res.statusCode) {
      cb(null);
    } else {
      cb(new Error('Bucket Check Failed status code=' + res.StatusCode));
    }
  });
};