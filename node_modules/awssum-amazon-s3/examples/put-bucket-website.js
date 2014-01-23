// ----------------------------------------------------------------------------

var fmt = require('fmt');
var amazonS3 = require('../awssum-amazon-s3.js');
// var amazonS3 = require('../');

// ----------------------------------------------------------------------------

s3 = new amazonS3.S3({
    'accessKeyId'     : process.env.ACCESS_KEY_ID,
    'secretAccessKey' : process.env.SECRET_ACCESS_KEY,
    'region'          : amazonS3.US_EAST_1,
});

// ----------------------------------------------------------------------------

// PutBucketWebsite
var args = {
    BucketName    : 'pie-17',
    IndexDocument : 'index.html',
};

s3.PutBucketWebsite(args, function(err, data) {
    fmt.dump(err);
    fmt.dump(data);
});

// ----------------------------------------------------------------------------
