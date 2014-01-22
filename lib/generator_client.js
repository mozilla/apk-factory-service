var request = require('request');


module.exports = function(config, manifest, zip, loadDir, cb) {

    var endpoint = [
        'http://',
        config.generator_server_hostname,
        ':',
        config.generator_server_port,
        '/build'
    ].join('');

console.log('Lets do this to', endpoint);

    var body = JSON.stringify({
      manifest: manifest,
      zip: zip,
      loadDir: loadDir
    });

    request({
        url: endpoint,
        method: 'POST',
        body: body,
        headers: {
            "Content-Type": "application/json"
        }
    }, function(err, res, body) {
      if (err) {
        cb(err);
      } else {
        console.log('AOK apk location=', typeof body, body);
        var data = JSON.parse(body);
        cb(null, data.zipFileLocation);
      }
    });
};