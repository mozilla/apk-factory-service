/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var crypto = require('crypto');
var path = require('path');
var url = require('url');

var _ = require('underscore');

var fileLoader = require('./file_loader');
var withConfig = require('../lib/config').withConfig;
withConfig(function(config) {
  var log = require('../lib/logging')(config);

  /**
   * Given a manifest url calls back with the hash of the manifest body
   */
  module.exports = function(manifestUrl, cb) {
    // TODO: duplicate code with front_controller
    var dirname;

    if (/^\w+:\/\//.test(manifestUrl)) {
      dirname = url.resolve(manifestUrl, '.');
    } else {
      dirname = path.dirname(path.resolve(process.cwd(), manifestUrl));
    }
    var loader = fileLoader.create(dirname);

    // TODO: duplicate code with owa_downloader
    var manifestFilename;
    if (/^\w+:\/\//.test(manifestUrl)) {
      manifestFilename = _(url.parse(manifestUrl).pathname.split('/')).last();
    } else {
      manifestFilename = path.basename(manifestUrl);
    }
    loader.load(manifestFilename, function(err, body) {
      if (err) {
        log.error('Cannot load manifest: ' + manifestFilename);
        return cb(err);
      }
      cb(null, sha1(body));
    });
  };
});

function sha1(text) {
  var sha = crypto.createHash('sha1');
  sha.update(text);
  return sha.digest('hex');
}
