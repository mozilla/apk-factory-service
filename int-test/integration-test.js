/**
 * Run under tape, integration tests this development server.
 * Optionally run against a different environment via
 * APK_ENDPOINT
 * Example:

 $ APK_ENDPOINT='http://dapk.net' tape int-test/integration-test.js

*/
process.env.APK_HASH_TTL = 1000;

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

var fsExtra = require('fs.extra');
var mysql = require('mysql');
var request = require('request');
var Step = require('step');
var tape = require('tape');

var desreUrl = 'http://people.mozilla.org/~fdesre/openwebapps/package.manifest';
var deltronUrl = 'http://deltron3030.testmanifest.com/manifest.webapp';

var apkTool = path.join(__dirname, '..', 'lib', 'ext', 'apktool.jar');

var opt = {
  encoding: 'utf8'
};
var config = require('../lib/config');

var configFiles = [
  path.join(__dirname, '../', 'config/default.js'),
  path.join(__dirname, '../', 'config/developer.js')
];

config.init({
  "config-files": configFiles.join(','),
});

var alwaysUpdating = require('./always_updating');

config.withConfig(function(config) {
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
      function checkApplicationZip(err/*, xml*/) {
        test.notOk(err, 'We read AndroidManifest.xml ' + err);
        // xml.indexOf('android:versionName="' + manifest.version) !== -1
        if ( !! manifest.package_path) {
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
        test.notOk(err, 'we could read the manifest ' + err);
        var reason = 'res/raw/manifest.json matches http version';
        var m = JSON.parse(raw);

        if ( !! manifest.package_path) {
          reason = 'res/raw/mini.json matches http version';
          m = JSON.parse(fs.readFileSync('decoded/res/raw/mini.json', opt));
        }
        test.deepEqual(m, manifest, reason);
        this(null);

      },
      function finish(err) {
        fsExtra.rmrfSync('decoded');
        test.notOk(err, err);
        cb(err);
      }
    );
  }

  var desreManifest, deltronManifest;
  tape('Manifests are available', function(test) {
    Step(
      function getDesreUrl() {
        request(desreUrl, this);
      },
      function loadDesre(err, res, body) {
        test.notOk(err, 'requested fdesre url ' + err);
        test.equal(res.statusCode, 200);
        desreManifest = JSON.parse(new Buffer(body).toString('utf8'));
        request(deltronUrl, this);
      },
      function loadDeltron3030(err, res, body) {
        test.notOk(err, 'requested deltron3030 manifest ' + err);
        test.equal(res.statusCode, 200);
        deltronManifest = JSON.parse(new Buffer(body).toString('utf8'));
        test.end();
      }
    );
  });

  tape('Components integrated behave as expected', function(test) {
    Step(
      function rmCache() {
        var that = this;

        var conn = mysql.createConnection(config.mysql);
        try {
          conn.connect();
          conn.query('DELETE FROM apk_metadata', [],
            function(err) {
              conn.end();
              that(err);
            });
        } catch (e) {
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
        test.notOk(err, 'file t check ' + err);
        testFile(test, 't', stdout, stderr, this);
      },
      function afterCurl1FileTest(err) {
        test.notOk(err, 'file t output checked ' + err);
        testApk(test, desreManifest, this);
      },
      function afterCurl1ApkTool(err) {
        test.notOk(err, 'apktool 1 check ' + err);
        test.end();
      }
    );
  });

  tape('We can build a hosted app', function(test) {
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
        test.notOk(err, 'file t output checked ' + err);
        testApk(test, deltronManifest, this);
      },
      function(err) {
        test.notOk(err, 'apktool 2 check ' + err);
        test.end();
      });
  });

  tape('We can get a cached packaged app', function(test) {
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
      function(err) {
        test.notOk(err);
        test.end();
      }
    );
  });

  tape('We can get a cached hosted app', function(test) {
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

  tape('DB can handle updates', function(test) {
    var server, serverPort, alwaysUpdatingManifest, alwaysUpdatingUrl;
    var conn, id, version, libraryVersion;
    Step(
      function startServer() {
        alwaysUpdating(this);
      },
      function serverCallback(err, aServer) {
        test.notOk(err, 'always updating server started ' + err);
        server = aServer;
        serverPort = server.address().port;
        alwaysUpdatingManifest = 'http://localhost:' + serverPort + '/manifest.webapp';
        alwaysUpdatingUrl = 'http://localhost:8080/application.apk?manifestUrl=' +
          alwaysUpdatingManifest;
        request(alwaysUpdatingUrl, this);
      },
      function afterGet1(err, res/*, body*/) {
        test.notOk(err, 'get request has no error ' + err);
        test.equal(200, res.statusCode, 'get request was 200');
        var that = this;
        conn = mysql.createConnection(config.mysql);
        try {
          conn.connect();
          conn.query('SELECT id, version, manifest_hash, library_version' +
            ' FROM apk_metadata WHERE manifest_url = ?', [alwaysUpdatingManifest],
            function(err, rows) {
              conn.end();
              test.equal(1, rows.length, 'We have one metadata record');
              that(err, rows[0]);
            });
        } catch (e) {
          console.error(e);
          that(e);
        }
      },
      function afterDb1(err, row) {
        test.notOk(err, 'No errors from reading the db');
        id = row.id;
        version = row.version;
        libraryVersion = row.library_version;
        var that = this;
        // We have a 1 second cache
        setTimeout(function() {
          request(alwaysUpdatingUrl, that);
        }, 2000);
      },
      function afterCurl2(err, res/*, body*/) {
        test.notOk(err, 'no error from request ' + err);
        test.equal(200, res.statusCode, 'request is 200');
        var that = this;
        conn = mysql.createConnection(config.mysql);
        try {
          conn.connect();
          conn.query('SELECT id, version, manifest_hash, library_version' +
            ' FROM apk_metadata WHERE manifest_url = ?', [alwaysUpdatingManifest],
            function(err, rows) {
              conn.end();
              that(err, rows[0]);
            });
        } catch (e) {
          console.error(e);
          that(e);
        }
      },
      function afterDb2(err, row) {
        test.notOk(err, 'no error from db SELECT ' + err);
        test.equal(id, row.id, 'ID is stable across updates');
        test.ok(version < row.version, 'Our version number increments ' + version + ' ' + row.version);
        test.equal(libraryVersion, row.library_version, 'Our APK Library version is stable');

        var that = this;
        conn = mysql.createConnection(config.mysql);
        try {
          conn.connect();
          conn.query('SELECT version, manifest_url' +
            ' FROM apk_metadata', [],
            function(err, rows) {
              conn.end();
              that(err, rows);
            });
        } catch (e) {
          console.error(e);
          that(e);
        }
      },
      function afterDbVersionsCheck(err, rows) {
        var that = this;
        test.notOk(err, 'No error after DB Vesion Check ' + err);
        test.ok(rows.length >= 3, "We've got atleast 3 manifest urls in there now...");
        var data = {
          installed: {

          }
        };
        rows.forEach(function(row) {
          data.installed[row.manifest_url] = row.version;
        });

        // Add an app that doesn't exist, it should not be reported as out of date
        data.installed['http://ozten.com/nonesuch/manifest.webapp'] = 1;
        setTimeout(function() {
          request({
            method: 'POST',
            url: 'http://localhost:8080/app_updates',
            body: JSON.stringify(data),
            headers: {
              'Content-Type': 'application/json'
            }
          }, that);
        }, 2000);// Wait out INT_TESTING caching
      },
      function afterAppUpdateRequest(err, res, body) {
        test.notOk(err, 'No error for request to app_updates ' + err);
        var outdated = JSON.parse(body).outdated;
        test.equal(1, outdated.length, 'only 1 app is out of date got ' + outdated.length);
        test.equal(outdated[0], alwaysUpdatingManifest,
          'Always updating manifest should appear outdated, but none others');
        server.close();
        test.end();
      }
    );
  });
});
