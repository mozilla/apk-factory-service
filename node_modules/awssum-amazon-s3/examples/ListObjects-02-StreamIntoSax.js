var dump = require('./dump.js');
var amazonS3 = require('../awssum-amazon-s3.js');
var sax = require('sax');

var s3 = new amazonS3.S3({
    'accessKeyId'     : process.env.ACCESS_KEY_ID,
    'secretAccessKey' : process.env.SECRET_ACCESS_KEY,
    'region'          : amazonS3.US_EAST_1,
});

var options = {
    BucketName : 'pie-17',
};

s3.ListObjects(options, { stream : true }, function(err, data) {
    dump(err, 'err');

    if ( !err ) {
        var lastText;

        // set up the XML parser
        var parser = sax.createStream(false);
        parser.on('text', function (t) {
            lastText = t;
        });
        parser.on("closetag", function(tag) {
            if ( tag === 'KEY' ) {
                console.log('* ' + lastText);
            }
        });

        // pipe the XML stream into the parser
        data.Stream.pipe(parser);
    }
});
