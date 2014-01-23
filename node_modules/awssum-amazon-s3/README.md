# awssum-amazon-s3 #

This is an ```AwsSum``` plugin!

You'll need to add [awssum-amazon-s3](https://github.com/awssum/awssum-amazon-s3/) to your package.json
dependencies. Both [awssum](https://github.com/awssum/awssum/) and
[awssum-amazon](https://github.com/awssum/awssum-amazon/) are pulled in as peer dependencies.

## Example ##

List all your buckets:

```
var fmt = require('fmt');
var amazonS3 = require('awssum-amazon-s3');

var s3 = new amazonS3.S3({
    'accessKeyId'     : process.env.ACCESS_KEY_ID,
    'secretAccessKey' : process.env.SECRET_ACCESS_KEY,
    'region'          : amazonS3.US_EAST_1
});

s3.ListBuckets(function(err, data) {
    fmt.dump(err, 'err');
    fmt.dump(data, 'data');
});
```

## Streaming ##

Streaming uploads:

```
var fmt = require('fmt');
var amazonS3 = require('awssum-amazon-s3');

var s3 = new amazonS3.S3({
    'accessKeyId'     : process.env.ACCESS_KEY_ID,
    'secretAccessKey' : process.env.SECRET_ACCESS_KEY,
    'region'          : amazonS3.US_EAST_1
});

// you must run fs.stat to get the file size for the content-length header (s3 requires this)
fs.stat(__filename, function(err, file_info) {
    var bodyStream = fs.createReadStream( __filename );

    var options = {
        BucketName    : bucket,
        ObjectName    : 'amazon.js',
        ContentLength : file_info.size,
        Body          : bodyStream
    };

    s3.PutObject(options, function(err, data) {
        fmt.dump(err, 'err');
        fmt.dump(data, 'data');
    });
});
```

Streaming downloads:

```
var fmt = require('fmt');
var amazonS3 = require('awssum-amazon-s3');

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
```

## Operations ##

### ListBuckets ###

Docs: [ListBuckets on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTServiceGET.html)

### DeleteBucket ###

Docs: [DeleteBucket on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketDELETE.html)

### DeleteBucketCors ###

Docs: [DeleteBucketCors on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketDELETEcors.html)

### DeleteBucketLifecycle ###

Docs: [DeleteBucketLifecycle on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketDELETElifecycle.html)

### DeleteBucketPolicy ###

Docs: [DeleteBucketPolicy on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketDELETEpolicy.html)

### DeleteBucketTagging ###

Docs: [DeleteBucketTagging on AWS]()

### DeleteBucketWebsite ###

Docs: [DeleteBucketWebsite on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketDELETEwebsite.html)

### ListObjects ###

Docs: [ListObjects on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGET.html)

### GetBucketAcl ###

Docs: [GetBucketAcl on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETacl.html)

### GetBucketCors ###

Docs: [GetBucketCors on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETcors.html)

### GetBucketLifecycle ###

Docs: [GetBucketLifecycle on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETlifecycle.html)

### GetBucketPolicy ###

Docs: [GetBucketPolicy on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETpolicy.html)

### GetBucketTagging ###

Docs: [GetBucketTagging on AWS]()

### GetBucketLocation ###

Docs: [GetBucketLocation on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETlocation.html)

### GetBucketLogging ###

Docs: [GetBucketLogging on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETlogging.html)

### GetBucketNotification ###

Docs: [GetBucketNotification on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETnotification.html)

### GetBucketObjectVersions ###

Docs: [GetBucketObjectVersions on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETVersion.html)

### GetBucketRequestPayment ###

Docs: [GetBucketRequestPayment on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTrequestPaymentGET.html)

### GetBucketVersioning ###

Docs: [GetBucketVersioning on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETversioningStatus.html)

### GetBucketWebsite ###

Docs: [GetBucketWebsite on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketGETwebsite.html)

### CheckBucket ###

Docs: [CheckBucket on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketHEAD.html)

### ListMultipartUploads ###

Docs: [ListMultipartUploads on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadListMPUpload.html)

### CreateBucket ###

Docs: [CreateBucket on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketPUT.html)

### PutBucketAcl ###

Docs: [PutBucketAcl on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketPUTacl.html)

### PutBucketCors ###

Docs: [PutBucketCors on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketPUTcors.html)

### PutBucketLifecycle ###

Docs: [PutBucketLifecycle on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketPUTlifecycle.html)

### PutBucketPolicy ###

Docs: [PutBucketPolicy on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketPUTpolicy.html)

### PutBucketLogging ###

Docs: [PutBucketLogging on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketPUTlogging.html)

### PutBucketNotification ###

Docs: [PutBucketNotification on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketPUTnotification.html)

### PutBucketTagging ###

Docs: [PutBucketTagging on AWS]()

### PutBucketRequestPayment ###

Docs: [PutBucketRequestPayment on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTrequestPaymentPUT.html)

### PutBucketVersioning ###

Docs: [PutBucketVersioning on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketPUTVersioningStatus.html)

### PutBucketWebsite ###

Docs: [PutBucketWebsite on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTBucketPUTwebsite.html)

### DeleteObject ###

Docs: [DeleteObject on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectDELETE.html)

### DeleteMultipleObjects ###

Docs: [DeleteMultipleObjects on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/multiobjectdeleteapi.html)

### GetObject ###

Docs: [GetObject on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectGET.html)

### GetObjectAcl ###

Docs: [GetObjectAcl on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectGETacl.html)

### GetObjectTorrent ###

Docs: [GetObjectTorrent on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectGETtorrent.html)

### GetObjectMetadata ###

Docs: [GetObjectMetadata on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectHEAD.html)

### OptionsObject ###

Docs: [OptionsObject on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTOPTIONSobject.html)

### PostObjectRestore ###

Docs: [PostObjectRestore on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectPOSTrestore.html)

### PutObject ###

Docs: [PutObject on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectPUT.html)

### PutObjectAcl ###

Docs: [PutObjectAcl on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectPUTacl.html)

### CopyObject ###

Docs: [CopyObject on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectCOPY.html)

### InitiateMultipartUpload ###

Docs: [InitiateMultipartUpload on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadInitiate.html)

### UploadPart ###

Docs: [UploadPart on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadUploadPart.html)

### UploadPartCopy ###

Docs: [UploadPartCopy on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadUploadPartCopy.html)

### CompleteMultipartUpload ###

Docs: [CompleteMultipartUpload on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadComplete.html)

### AbortMultipartUpload ###

Docs: [AbortMultipartUpload on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadAbort.html)

### ListParts ###

Docs: [ListParts on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadListParts.html)



# Author #

Written by [Andrew Chilton](http://chilts.org/) - [Blog](http://chilts.org/blog/) -
[Twitter](https://twitter.com/andychilton).

# License #

* [Copyright 2011-2013 Apps Attic Ltd.  All rights reserved.](http://appsattic.mit-license.org/2011/)
* [Copyright 2013 Andrew Chilton.  All rights reserved.](http://chilts.mit-license.org/2013/)

(Ends)
