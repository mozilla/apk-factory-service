/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var request = require('request');

var BLOB_TYPE = require('../lib/apk_generator').BLOB_TYPE;
var S3_TYPE = require('../lib/apk_generator').S3_TYPE;
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
  log.info('Requesting ' + config.generator_endpoint + '/build');
  request({
    url: config.generator_endpoint + '/build',
    method: 'POST',
    body: body,
    headers: {
      "Content-Type": "application/json"
    },
    hawk: {
      credentials: config.hawk
    }
  }, function(err, res, body) {
    if (err || 200 !== res.statusCode) {
      if (res && res.statusCode && body) {
        log.debug(res.statusCode + ' ' + body);
        log.debug('Are you trying a review server? endpoint was ' +
          config.generator_endpoint + '/build');
      }
      cb(err ||
        new Error('Generator response status code was ' + res.statusCode));
    } else {
      var data = {};
      try {
        data = JSON.parse(body);
      } catch (e) {
        data.status = 'error';
        log.error('Problem parsing generator response ' + body);
        log.error(e);
      }
      if ('okay' === data.status) {
        var locationType;
        if ('release' === config.environment) {
          locationType = S3_TYPE;
        } else {
          locationType = BLOB_TYPE;
        }
        log.debug('data.locationType=', locationType, data.locationType);

        // Assert we get the expected type of location
        if (locationType === data.locationType) {
          if (S3_TYPE === data.locationType) {
            cb(null, data.locationType, data.apkFileLocation);
          } else {
            cb(null, data.locationType, data.blob);
          }

        } else {
          cb(new Error('Deployment error, expected ' + locationType + ', but got ' +
                       data.apkFileLocation));
        }
      } else {
        cb(new Error('Error in generator - ' + body));
      }
    }
  });
};
