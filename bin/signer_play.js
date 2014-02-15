/*
Temporary test file
*/
var argv = require('../lib/cli_common_argv');
var config = require('../lib/config');
config.init(argv);
var signer = require('../lib/apk_signer_client');
config.withConfig(function(config) {

    signer.get('/system/auth', function(err, body) {
	console.error(err);
	console.log(body);
	if (err) process.exit(1);


	var apkHash = 'f489b4bd0abb751c3d7f33a6a3e0cf17e6c4acc1932b992e1bb017fdeacb80d0';
//	apkHash='b28c94b2195c8ed259f0b415aaee3f39b0b2920a4537611499fa044956917a21';
//	apkHash = '6c20bc35aea38bf54b685eb45f8b092f89fa46e8';


	signer.post('/sign', {
	    apk_id: 'TestApp-release-unsigned',
	    unsigned_apk_s3_path: 'TestApp-release-unsigned.apk',
	    unsigned_apk_s3_hash: apkHash,
            signed_apk_s3_path: 'TestApp-release.apk'
	    
	}, function(err, res, body) {
	    console.log('err=', err);
	    console.log(res);
	    console.log(body);
	});


/*	signer.post('/system/auth', {}, function(err, res, body) {
	    console.log('err=', err);
	    console.log(res);
	    console.log(body);
	});*/
    });
});