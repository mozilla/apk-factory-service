/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');

var gm = require('gm');

exports.optimize = function(inputImage, width, height, outputPrefix, cb) {
  // TODO handle data URIs ?
  // TODO support outputting jpeg or SVG in some cases?
  var icon = gm(inputImage);
  icon.identify(function(err, info) {
    if (err) return cb(err);
    icon.noProfile();
    icon.resize(width, height);
    icon.write(outputPrefix + '.png', function(err) {
      cb(err);
    });
  });
};

/*
  TODO: Stream API, if we can detect errors and file formats...
  exports.optimize = function(inputImage, width, height, outputPrefix, cb) {
  gm(fs.createReadStream(inputImage), inputImage)
  .on('error', function(err, a) {console.log('stream', err, a)})
  .resize(width, height)
  .stream('png')
  .pipe(fs.createWriteStream(outputPrefix + '.png'))
  .on('close', function(err, a, b) {
  console.log('err=', err, 'a=', a, b);
  cb(err);
  });
  };
*/