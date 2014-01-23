# Operations #

## PutObject ##

* [PutObject on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectPUT.html)

### Params ###

<table>
  <thead>
    <tr>
      <th width="20%">Param Name</th>
      <th width="10%">Required</th>
      <th width="10%">Type</th>
      <th width="60%">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>BucketName</td>
      <td>required</td>
      <td>special</td>
      <td></td>
    </tr>
    <tr>
      <td>ObjectName</td>
      <td>required</td>
      <td>special</td>
      <td></td>
    </tr>
    <tr>
      <td>Range</td>
      <td>optional</td>
      <td>header</td>
      <td></td>
    </tr>
    <tr>
      <td>IfModifiedSince</td>
      <td>optional</td>
      <td>header</td>
      <td></td>
    </tr>
    <tr>
      <td>IfUnmodifiedSince</td>
      <td>optional</td>
      <td>header</td>
      <td></td>
    </tr>
    <tr>
      <td>IfMatch</td>
      <td>optional</td>
      <td>header</td>
      <td></td>
    </tr>
    <tr>
      <td>IfNoneMatch</td>
      <td>optional</td>
      <td>header</td>
      <td></td>
    </tr>
    <tr>
      <td>ResponseContentType</td>
      <td>optional</td>
      <td>param</td>
      <td></td>
    </tr>
    <tr>
      <td>ResponseContentLanguage</td>
      <td>optional</td>
      <td>param</td>
      <td></td>
    </tr>
    <tr>
      <td>ResponseExpires</td>
      <td>optional</td>
      <td>param</td>
      <td></td>
    </tr>
    <tr>
      <td>ResponseCacheControl</td>
      <td>optional</td>
      <td>param</td>
      <td></td>
    </tr>
    <tr>
      <td>ResponseContentDisposition</td>
      <td>optional</td>
      <td>param</td>
      <td></td>
    </tr>
    <tr>
      <td>ResponseContentEncoding</td>
      <td>optional</td>
      <td>param</td>
      <td></td>
    </tr>
    <tr>
      <td>VersionId</td>
      <td>optional</td>
      <td>param</td>
      <td></td>
    </tr>
  </tbody>
</table>

### Examples ###

#### Streaming Uploads (from file) ####

```
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

## GetObject ##

* [GetObject on AWS](http://docs.amazonwebservices.com/AmazonS3/latest/API/RESTObjectGETacl.html)

### Params ###

<table>
  <thead>
    <tr>
      <th width="20%">Param Name</th>
      <th width="10%">Required</th>
      <th width="10%">Type</th>
      <th width="60%">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>BucketName</td>
      <td>required</td>
      <td>special</td>
      <td></td>
    </tr>
  </tbody>
</table>

### Examples ###

#### Streaming Downloads ####

```
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

(Ends)
