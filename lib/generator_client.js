/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var request = require('request');

/**
 * manifest has several properties
 *   url - original manifest url
 *   data - actual manifest
 *   ourVersion - server side version number
 *   appType - Type of OWA (hosted or packaged)
 *   noCache - Optional, defaults to false controls apk caching
 */
module.exports = function(config, manifest, zip, loadDir, log, cb) {

  var body = JSON.stringify({
    manifest: manifest,
    zip: zip,
    loadDir: loadDir
  });

  log.info('Requesting ' +  config.generator_endpoint + '/build');
  console.log('Requesting ' +  config.generator_endpoint + '/build');
  request({
    url: config.generator_endpoint + '/build',
    method: 'POST',
    body: body,
    headers: {
      "Content-Type": "application/json"
    },
    hawk: {credentials: config.hawk}
  }, function(err, res, body) {
    if (err || 200 !== res.statusCode) {
      log.debug(res.statusCode + ' ' + body);
      log.debug('Are you trying a review server? endpoint was ' +
                config.generator_endpoint + '/build');
      cb(err ||
         new Error('Generator response status code was ' + res.statusCode));
    } else {
      var data = {};
      try {
        data = JSON.parse(body);
      } catch (e) {
        data.status = 'error';
        log.error('Problem parsing generator response');
        log.error(e);
      }
      if ('okay' === data.status) {
        cb(null, data.apkFileLocation);
      } else {
        cb(new Error('Error in generator - ' + body));
      }
    }
  });
};