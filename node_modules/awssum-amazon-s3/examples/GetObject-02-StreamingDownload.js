// Get Object (Streaming)
var fs = require('fs');

var fmt = require('fmt');
var amazonS3 = require('awssum-amazon-s3.js');

var s3 = new amazonS3.S3({
    'accessKeyId'     : process.env.ACCESS_KEY_ID,
    'secretAccessKey' : process.env.SECRET_ACCESS_KEY,
    'region'          : amazonS3.US_EAST_1
});

var options = {
    BucketName    : 'pie-17',
    ObjectName    : 'javascript-file.js',
};

s3.GetObject(options, { stream : true }, function(err, data) {
    fmt.dump(err, 'err');
    fmt.dump(data, 'data');

    // stream this file to stdout
    fmt.sep();
    fmt.title('The File');
    data.Stream.pipe(process.stdout);
    data.Stream.on('end', function() {
        fmt.sep();
    });
});
