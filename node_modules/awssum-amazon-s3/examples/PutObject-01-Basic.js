var dump = require('./dump.js');
var amazonS3 = require('../awssum-amazon-s3.js');

var s3 = new amazonS3.S3({
    'accessKeyId'     : process.env.ACCESS_KEY_ID,
    'secretAccessKey' : process.env.SECRET_ACCESS_KEY,
    'region'          : amazonS3.US_EAST_1,
});

var content = 'Hello, World!';
var args = {
    BucketName    : 'pie-17',
    ObjectName    : 'hello-world.txt',
    ContentLength : content.length,
    Body          : content,
};

s3.PutObject(args, function(err, data) {
    dump(err, 'err');
    dump(data, 'data');
});
