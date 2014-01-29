/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var request = require('request');

module.exports = function(config, manifest, zip, loadDir, cb) {
  var endpoint = [
    'http://',
    config.generator_server_hostname,
    ':',
    config.generator_server_port,
    '/build'
  ].join('');

  var body = JSON.stringify({
    manifest: manifest,
    zip: zip,
    loadDir: loadDir
  });

  request({
    url: endpoint,
    method: 'POST',
    body: body,
    headers: {
      "Content-Type": "application/json"
    }
  }, function(err, res, body) {
    if (err || 200 !== res.statusCode) {
      cb(err || 'Generator response status code was ' + res.statusCode);
    } else {
      var data = JSON.parse(body);
      if ('okay' === data.status) {
        cb(null, data.zipFileLocation);
      } else {
        cb('Error in generator - ' + body);      
      }
    }
  });
};