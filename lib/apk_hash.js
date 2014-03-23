/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var crypto = require('crypto');
var path = require('path');

var lru = require('ttl-lru-cache')({
  maxLength: 5000
});

var fileLoader = require('./file_loader');
var withConfig = require('../lib/config').withConfig;

withConfig(function(config) {
  var log = require('../lib/logging')(config);
  var HASH_TTL = config.manifestCacheTTL * 1000;

  /**
   * Given a manifest url calls back with the hash of the manifest body
   */
  module.exports = function(manifestUrl, cb) {

    var manifestHash = lru.get(manifestUrl);
    if (undefined !== manifestHash) {
      console.log('APK Hash hit', manifestHash);
      log.info('APK Hash cache hit [' + HASH_TTL + '] for ', manifestUrl);
      return cb(null, manifestHash);
    } else {
      console.log('APK Hash cache miss, using request');
    }

    // TODO: duplicate code with front_controller
    var dirname;

    if (/^\w+:\/\//.test(manifestUrl)) {
      dirname = manifestUrl;
    } else {
      dirname = path.dirname(path.resolve(process.cwd(), manifestUrl));
    }
    var loader = fileLoader.create(dirname);

    // TODO: duplicate code with owa_downloader
    var manifestFilename;
    if (/^\w+:\/\//.test(manifestUrl)) {
      manifestFilename = '';
    } else {
      manifestFilename = path.basename(manifestUrl);
    }
    loader.load(manifestFilename, function(err, body) {
      if (err) {
        log.error('Cannot load manifest: ' + manifestFilename);
        return cb(err);
      }
      manifestHash = sha1(body);
      console.log('APK Hash populating cache');
      log.info('APK Hash cache ' + HASH_TTL + ' miss for ', manifestUrl);
      lru.set(manifestUrl, manifestHash, HASH_TTL);
      cb(null, manifestHash);
    });
  };
});

function sha1(text) {
  var sha = crypto.createHash('sha1');
  sha.update(text);
  return sha.digest('hex');
}
