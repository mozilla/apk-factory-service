/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var gm = require('gm');

exports.optimize = function(inputImage, width, height, outputPrefix, cb) {
  // TODO handle data URIs ?
  // TODO support outputting jpeg or SVG in some cases?
  var icon = gm(inputImage);
  icon.identify(function(err/*, info*/) {
    if (err) return cb(err);
    icon.noProfile();
    icon.resize(width, height);
    icon.write(outputPrefix + '.png', function(err) {
      cb(err, outputPrefix + '.png');
    });
  });
};