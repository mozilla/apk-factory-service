/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var gm = require('gm');

var fsUtil = require('./fs_util');
/**
 * @param inputImage {string} - Path to the image
 * @param width {integer} - Size of destination image
 * @param height {integer} - Size of destination image
 * @param outputPrefix {string} - Prefix for path to destination image
 * @param cb {function} - function(err, outputPath)
 */
exports.optimize = function(inputImage, width, height, outputPrefix, cb) {
  var destPng = outputPrefix + '.png';
  fsUtil.ensureDirectoryExistsFor(destPng);

  var icon = gm(inputImage);
  icon.identify(function(err/*, info*/) {
    if (err) return cb(err);
    icon.noProfile();
    icon.resize(width, height);
    icon.write(destPng, function(err) {
      cb(err, destPng);
    });
  });
};