/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var amazonS3 = require('awssum-amazon-s3');
var withConfig = require('../lib/config').withConfig;

var s3;
var bucketCreated = false;

function ensureBucket(config, bucketName, cb) {
  if (false === bucketCreated) {
    bucketCreated = true;
    s3.CreateBucket({
      BucketName: bucketName
    }, cb);
  } else {
    cb(null);
  }
}
withConfig(function(config) {
  var bucketName = config.awsS3PublicBucket;

  s3 = new amazonS3.S3({
    'accessKeyId': config.awsAccessKeyId,
    'secretAccessKey': config.awsSecretAccessKey,
    'region': amazonS3.US_EAST_1
  });

  module.exports = {
    saveApk: function(key, apk, apkLength, cb) {
      ensureBucket(config, bucketName, function(err) {
        if (err) {
          console.log('ERROR writing to bucket', bucketName, key, err);
          return cb(err);
        }
        s3.PutObject({
          BucketName: bucketName,
          ObjectName: key,
          ContentLength: apkLength,
          Body: apk
        }, cb);
      });
    },
    getApk: function(key, cb) {
      s3.GetObject({
        BucketName: bucketName,
        ObjectName: key
      }, cb);
    },
    deleteApk: function(key, cb) {
      cb = cb || function() {};
      s3.DeleteObject({
        BucketName: bucketName,
        ObjectName: key
      }, cb);
    },
    checkBucket: function(cb) {
      s3.CheckBucket({
        BucketName: bucketName
      }, cb);
    }
  };
});