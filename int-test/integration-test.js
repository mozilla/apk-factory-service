/**
 * Run under tap, integration tests this development server.
 * Optionally run against a different environment via
 * APK_ENDPOINT
 * Example:

 $ APK_ENDPOINT='http://dapk.net' tap int-test/integration-test.js

*/
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

var fsExtra = require('fs.extra');
var mysql = require('mysql');
var request = require('request');
var Step = require('step');
var tap = require('tap');

var desreUrl = 'http://people.mozilla.org/~fdesre/openwebapps/package.manifest';
var deltronUrl = 'http://deltron3030.testmanifest.com/manifest.webapp';

var apkTool = path.join(__dirname, '..', 'lib', 'ext', 'apktool.jar');

var opt =  {encoding: 'utf8'};

require('../lib/config')(function(config) {
  var baseUrl = process.env.APK_ENDPOINT ||
    'http://localhost:' + config.controller_server_port;

  function makeUrl(manifestUrl) {
    return baseUrl + '/application.apk?manifestUrl=' + 
      encodeURIComponent(manifestUrl);
  }

  function testFile(test, prefix, stdout, stderr, cb) {
    if (stderr === '') {
      if (stdout.trim() === prefix + ': Zip archive data, at least v2.0 to extract') {
        cb();
      } else {
        test.notOk(true, 'stdout did not match expected [' + stdout + ']');
      }
    } else {
      test.notOk(true, 'stderr was not empty on curl1 ' + stderr);
    }
  }

  function testApk(test, manifest, cb) {
    fsExtra.rmrfSync('decoded');
    Step(
      function runApkTool() {
        exec("java -jar " + apkTool + " d t decoded", this);
      },
      function checkAndroidManifest(err, stdout, stderr) {
        test.notOk(err, err + ' ' + stderr);
        fs.readFile(path.join('decoded', 'AndroidManifest.xml'), opt, this);
      },
      function checkApplicationZip(err, xml) {
        test.notOk(err, 'We read AndroidManifest.xml');
        // xml.indexOf('android:versionName="' + manifest.version) !== -1
        if (!! manifest.package_path) {
          var that = this;
          exec('file decoded/res/raw/application.zip', function(err, stdout, stderr) {
            test.notOk(err);
            testFile(test, 'decoded/res/raw/application.zip', stdout, stderr, that);
          });
        } else {
          this(null);
        }
      },
      function checkManifest(err) {
        test.notOk(err, err);
        fs.readFile('decoded/res/raw/manifest.json', opt, this);
      },
      function compareManifest(err, raw) {
        test.notOk(err, 'we could read the manifest');
        var reason = 'res/raw/manifest.json matches http version';
        var m = JSON.parse(raw);

        if (!! manifest.package_path) {
          reason = 'res/raw/mini.json matches http version';
          m = JSON.parse(fs.readFileSync('decoded/res/raw/mini.json', opt));
        }
        test.deepEqual(m, manifest, reason);
        this(null);

      },
      function finish(err) {
        test.notOk(err, err);
        cb(err);
      }
    );
  }

  var desreManifest, deltronManifest;

  tap.test('Manifests are available', function(test) {
    Step(
      function getDesreUrl() {
        request(desreUrl, this);
      },
      function loadDesre(err, res, body) {
        test.notOk(err, 'requested fdesre url');
        test.equal(res.statusCode, 200);
        desreManifest = JSON.parse(new Buffer(body).toString('utf8'));
        request(deltronUrl, this);
      },
      function loadDeltron3030(err, res, body) {
        test.notOk(err, 'requested deltron3030 manifest');
        test.equal(res.statusCode, 200);
        deltronManifest = JSON.parse(new Buffer(body).toString('utf8'));
        test.end();
      }
    );
  });

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
        test.notOk(err, 'file t check');
        testFile(test, 't', stdout, stderr, this);
      },
      function afterCurl1FileTest(err) {
        test.notOk(err, 'file t output checked');
        testApk(test, desreManifest, this);
      },
      function afterCurl1ApkTool(err) {
        test.notOk(err, 'apktool 1 check');
        test.end();
      }
    )});

  tap.test('We can build a hosted app', function(test) {
    Step(
      function curl2() {
        var r = request(makeUrl(deltronUrl)).pipe(fs.createWriteStream('t'));
        r.on('close', this);
      },
      function afterCurl2(err) {
        test.notOk(err, err);
        exec("file t", this);
      },
      function afterCurl2File(err, stdout, stderr) {
        test.notOk(err, err);
        testFile(test, 't', stdout, stderr, this);
      },
      function afterCurl2FileTest(err) {
        test.notOk(err, 'file t output checked');
        testApk(test, deltronManifest, this);
      },
      function(err) {
        test.notOk(err, 'apktool 2 check');
        test.end();
      })
  });

  tap.test('We can get a cached packaged app', function(test) {
    Step(
      function curl3() {

        var r = request(makeUrl(desreUrl)).pipe(fs.createWriteStream('t'));
        r.on('close', this);
      },
      function afterCurl3(err) {
        test.notOk(err);
        exec("file t", this);
      },
      function afterCurl3File(err, stdout, stderr) {
        test.notOk(err);
        testFile(test, 't', stdout, stderr, this);
      },      
      function (err) {
        test.notOk(err);
        test.end();
      }
    )});

  tap.test('We can get a cached hosted app', function(test) {
    Step(
      function curl4() {
        var r = request(makeUrl(deltronUrl)).pipe(fs.createWriteStream('t'));
        r.on('close', this);
      },
      function afterCurl4(err) {
        test.notOk(err);
        exec("file t", this);
      },
      function afterCurl4File(err, stdout, stderr) {
        test.notOk(err);
        testFile(test, 't', stdout, stderr, this);
      },
      function finish() {
        test.end();
      }
    );
  });
});