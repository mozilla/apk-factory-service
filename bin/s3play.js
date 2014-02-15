
var crypto = require('crypto');
var fs = require('fs');

var argv = require('../lib/cli_common_argv');
var config = require('../lib/config');
config.init(argv);
var s3 = require('../lib/s3');
var newApkCacheFile = '/home/ozten/apk-factory-service-extra/TestApp-release-unsigned.apk';
//'/home/ozten/apk-factory-service/FbImport-release-unsigned.apk';

  fs.stat(newApkCacheFile, function(err, stat) {
    if (err) {
      console.log('stat failed for ', newApkCacheFile);
      console.error(err);
	process.exit(1);
    }
fs.readFile(newApkCacheFile,
	    {},
	    function(err, data) {
		if (err) {
		    console.log('read file failed for ', newApkCacheFile);
		    console.error(err);
		    process.exit(1);
		}

		console.log('read ', newApkCacheFile, 'saving as ', 'TestApp-release-unsigned.apk');

		s3.saveApk('TestApp-release-unsigned.apk', data, stat.size, function(err) {
		    console.log(err);
		    console.log('done');

		    s3.getApk('TestApp-release-unsigned.apk', function(err, data) {
			console.log('GET err=', err);
			var hash = crypto.createHash('sha256');
			hash.update(data.Body.toString('binary'));
			console.log(hash.digest('hex'));
			fs.writeFile(newApkCacheFile + '.from.s3', data.Body, function(err) {
			    console.log('wrote file');
			});
		    });

		});
	    });
  });
/*
config.withConfig(function(config) {
    signer.get('/system/auth', function(err, body) {
	console.error(err);
	console.log(body);
    });
});
*/