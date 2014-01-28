/**
 * Run under tap, integration tests this development server.
 * Optionally run against a different environment via
 * APK_ENDPOINT
 * Example:

 $ APK_ENDPOINT='http://dapk.net' tap int-test/integration-test.js

*/
var exec = require('child_process').exec;
var fs = require('fs');

var mysql = require('mysql');
var request = require('request');
var Step = require('step');
var tap = require('tap');

var desreUrl = 'http://people.mozilla.org/~fdesre/openwebapps/package.manifest';
var deltronUrl = 'http://deltron3030.testmanifest.com/manifest.webapp';

require('../lib/config')(function(config) {
  var baseUrl = process.env.APK_ENDPOINT ||
    'http://localhost:' + config.controller_server_port;

  function makeUrl(manifestUrl) {
    return baseUrl + '/application.apk?manifestUrl=' + 
      encodeURIComponent(manifestUrl);
  }

  function testFile(test, stdout, stderr, cb) {
    if (stderr === '') {
      if (stdout.trim() === 't: Zip archive data, at least v2.0 to extract') {
        cb();
      } else {
        test.notOk('stdout did not match expected [' + stdout + ']');
      }
    } else {
      test.notOk('stderr was not empty on curl1 ' + stderr);
    }
  }

  tap.test('Components integrated behave as expected', function(test) {
    Step(
      function rmCache() {
        var that = this;

        var conn = mysql.createConnection(config.mysql);
        try {
          conn.connect();
          conn.query('DELETE FROM apk_metadata', [],
                     function(err/*, rows, fields*/) {
                        conn.end();
                        that(err);
                      });
        } catch(e) {
          console.error(e);
          that(e);
        }
      },
      function curl1(err) {
        test.notOk(err);
        var r = request(makeUrl(desreUrl)).pipe(fs.createWriteStream('t'));
        r.on('close', this);
      },
      function afterCurl1(err) {
        test.notOk(err);
        exec("file t", this);
      },
      function afterCurl1File(err, stdout, stderr) {
        test.notOk(err);
        testFile(test, stdout, stderr, this);
      },      
      function curl2(err) {
        test.notOk(err);
        var r = request(makeUrl(deltronUrl)).pipe(fs.createWriteStream('t'));
        r.on('close', this);
      },
      function afterCurl2(err) {
        test.notOk(err);
        exec("file t", this);
      },
      function afterCurl2File(err, stdout, stderr) {
        test.notOk(err);
        testFile(test, stdout, stderr, this);
      },
      function curl3(err) {
        test.notOk(err);
        var r = request(makeUrl(desreUrl)).pipe(fs.createWriteStream('t'));
        r.on('close', this);
      },
      function afterCurl3(err) {
        test.notOk(err);
        exec("file t", this);
      },
      function afterCurl3File(err, stdout, stderr) {
        test.notOk(err);
        testFile(test, stdout, stderr, this);
      },      
      function curl4(err) {
        test.notOk(err);
        var r = request(makeUrl(deltronUrl)).pipe(fs.createWriteStream('t'));
        r.on('close', this);
      },
      function afterCurl4(err) {
        test.notOk(err);
        exec("file t", this);
      },
      function afterCurl4File(err, stdout, stderr) {
        test.notOk(err);
        testFile(test, stdout, stderr, this);
      },
      function finish() {
        test.end();
      }
    );
  });
});