var fs = require('fs');

var dump = require('./dump.js');
var amazonS3 = require('awssum-amazon-s3.js');

var s3 = new amazonS3.S3({
    'accessKeyId'     : process.env.ACCESS_KEY_ID,
    'secretAccessKey' : process.env.SECRET_ACCESS_KEY,
    'region'          : amazonS3.US_EAST_1
});

// you must run fs.stat to get the file size for the content-length header (s3 requires this)
fs.stat(__filename, function(err, file_info) {
    var bodyStream = fs.createReadStream( __filename );

    var options = {
        BucketName    : 'pie-17',
        ObjectName    : 'javascript-file.js',
        ContentLength : file_info.size,
        Body          : bodyStream
    };

    s3.PutObject(options, function(err, data) {
        dump(err, 'err');
        dump(data, 'data');
    });
});
