var filename = '/home/ozten/apk-factory-service/FbImport-release-unsigned.apk';
var crypto = require('crypto');
var fs = require('fs');

var shasum = crypto.createHash('sha1');

var s = fs.ReadStream(filename);
s.on('data', function(d) {
    shasum.update(d);
});

s.on('end', function() {
    var d = shasum.digest('hex');
    console.log(d + '  ' + filename);
});