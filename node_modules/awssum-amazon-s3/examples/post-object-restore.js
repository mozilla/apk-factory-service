// ----------------------------------------------------------------------------

var fmt = require('fmt');
var amazonS3 = require('../awssum-amazon-s3.js');

// ----------------------------------------------------------------------------

s3 = new amazonS3.S3({
    'accessKeyId'     : process.env.ACCESS_KEY_ID,
    'secretAccessKey' : process.env.SECRET_ACCESS_KEY,
    'region'          : amazonS3.US_EAST_1,
});

// ----------------------------------------------------------------------------

// PostObjectRestore
var args = {
    BucketName : 'bucket',
    ObjectName : 'wedding.png',
    Days       : '1',
};

s3.PostObjectRestore(args, function(err, data) {
    fmt.dump(err);
    fmt.dump(data);
});

// ----------------------------------------------------------------------------
