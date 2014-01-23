var dump = require('./dump.js');
var amazonS3 = require('../awssum-amazon-s3.js');

var s3 = new amazonS3.S3({
    'accessKeyId'     : process.env.ACCESS_KEY_ID,
    'secretAccessKey' : process.env.SECRET_ACCESS_KEY,
    'region'          : amazonS3.US_EAST_1,
});

var options = {
    BucketName    : 'pie-17',
};

s3.ListObjects(options, function(err, data) {
    dump(err, 'err');
    dump(data, 'data');
});
