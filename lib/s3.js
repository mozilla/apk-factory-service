var amazonS3 = require('awssum-amazon-s3');
var withConfig = require('../lib/config').withConfig;

var s3;

function ensureBucket(config, bucketName, cb) {
  if (!s3) {
    s3 = new amazonS3.S3({
      'accessKeyId': config.awsAccessKeyId,
      'secretAccessKey': config.awsSecretAccessKey,
      'region': amazonS3.US_EAST_1
    });

    s3.CreateBucket({
      BucketName: bucketName
    }, cb);
  } else {
    cb(null);
  }
}
withConfig(function(config) {
  var bucketName = 'apk-factory-' + config.environment;
// stage    'net.mozaws.stage.apk.public';

//TODO: net.mozaws.stage.apk.private
  module.exports = {
    saveApk: function(key, apk, apkLength, cb) {
      ensureBucket(config, bucketName, function(err) {
        if (err) {
	    console.log('ERROR writing to bucket', bucketName, key);
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
      ensureBucket(config, bucketName, function(err) {
        if (err) {
	    console.log('ERROR reading from bucket', bucketName);
          return cb(err);
        }
        s3.GetObject({
          BucketName: bucketName,
          ObjectName: key
        }, cb);
      });
    }
  };
});