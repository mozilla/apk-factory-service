/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


var withConfig = require('../lib/config').withConfig;

var knox = require('knox');

withConfig(function(config) {

  var client = knox.createClient({
    key: config.awsAccessKeyId,
    secret: config.awsSecretAccessKey,
    bucket: config.awsS3PublicBucket
  });

  module.exports = {
    saveApk: function(key, apk, apkLength, cb) {
      var headers = {
        'Content-Length': apkLength,
        'Content-Type': 'application/vnd.android.package-archive'
      };
      client.put(key, headers, cb)
        .on('response', cb)
        .end(apk);
    },
    getApk: function(key, cb) {
      client.get(key).on('response', function(res) {
        if (200 !== res.statusCode) {
          var err = 'controller unable to load ' + res.req.path +
            ' from S3. Status Code: ' + res.statusCode;
          cb(err);
        } else {
          cb(null, res);
        }
      }).end();
    },
    deleteApk: function(key, cb) {
      cb = cb || function() {};
      client.del(key).on('response', cb).end();
    },
    checkBucket: function(cb) {
      client.head('/').on('response', cb).end();
    }
  };
});
