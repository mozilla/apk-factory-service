#!/usr/bin/env node

/* vim: set filetype=javascript : */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  Given an environment, test all OWA
*/

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var _ = require('underscore');
var async = require('async');
var optimist = require('optimist');
var request = require('request');

var regressionDb = require('./lib/regression_db');
var sha1 = require('../lib/sha1');

process.on('uncaughtException', function(err) {
  if (err.stack) {
    console.log('Uncaught exception: ', err.stack);
  } else {
    console.log(err);
  }
});

var argv = optimist
  .usage('Usage: $0 [OPTIONS] --endpoint=http://example.com')

.option('endpoint', {
  alias: 'e',
  demand: true
})

.option('config', {
  alias: 'c',
  "default": path.resolve(__dirname, '..', 'config', 'default.js')
})

.check(function(args) {
  // Admin Config
  if (false === fs.existsSync(args.config)) {
    throw new Error('Regression test run config file required, unable to use ' + args.config);
  }
})
  .argv;

console.log('Testing ', argv.endpoint);
fs.mkdir('/tmp/apk-regression', function() {});

var config = vm.createContext();
vm.runInContext(fs.readFileSync(argv.config), config, argv.config);

async.parallel({
  envs: function(cb1) {
    regressionDb.envs(config, cb1);
  },
  owas: function(cb1) {
    regressionDb.owas(config, cb1);
  }
}, function(err, results) {
  if (err) throw err;
  console.log('Potentially testing ' + results.owas.length + ' apps');

  var curEnv = _.find(results.envs, function(env) {
    return argv.endpoint === env.endpoint_url;
  });

  if (!curEnv) throw new Error('Unknown environment ' + argv.endpoint + ' choose from ' +
    _.reduce(results.envs, function(memo, env) {
      if (memo === null) {
        return env.endpoint_url;
      } else {
        return memo + ', ' + env.endpoint_url;
      }
    }, null));

  testApks(argv, results.owas, curEnv);
});

function makeUrl(baseUrl, manifestUrl) {
  return baseUrl + '/application.apk?manifestUrl=' +
    encodeURIComponent(manifestUrl);
}

function testApks(argv, owas, curEnv) {
  var nOwas = [];
  for (var i = 0; i < owas.length; i++) {
    // Replace N% of owa with APKs we've never built before
    if (0.00 > Math.random()) {
      var nName = 'deltron' + Math.round(Math.random() * 100000);
      var nUrl = 'http://' + nName + '.testmanifest.com/manifest.webapp';
      console.log('replacing owa with', nUrl);
      owas[i].id = sha1(nUrl);
      owas[i].name = nName;
      owas[i].manifest_url = nUrl;
      nOwas.push([sha1(nUrl), nName, nUrl]);
    }
  }
  if (0 < nOwas.length) {
    regressionDb.bulkAddOWA(config, nOwas, function(e) {
      console.log('Unable to bulk add owas', e);
    });
  }
  async.eachLimit(owas, 10, function(owa, cbEl) {
    var apkUrl = makeUrl(argv.endpoint, owa.manifest_url);
    var result = {
      envId: curEnv.id,
      owaId: owa.id,
      hosted: true,
      validJar: false,
      statusCode: 0,
      apkSize: 0,
      apkVersion: 0,
      outdated: false,
      keepTesting: true // State of this test run
    };

    testApk(apkUrl, owa, result, cbEl);
  }, function(err) {
    if (err) {
      console.log('OUCH ERROR, should never happen!!!');
      if (err.stack) {
        console.log(err.stack);
      } else {
        console.log(err);
      }
    }
    console.log('Finished run');
  });
}

function testApk(apkUrl, owa, result, cb) {
  var reqOpts = {
    strictSSL: false,
    encoding: null
  };
  async.waterfall([

    function getMiniManifest(cb2) {
      result.start = new Date();
      request(owa.manifest_url, {
        encoding: 'utf8'
      }, cb2);
    },
    function recordManifest(res, body, cb2) {
      try {
        var miniMani = JSON.parse(body);
        if (miniMani.package_path && miniMani.package_path.length > 0) {
          result.hosted = false;
        }
        cb2(null);
      } catch (e) {
        cb2(e);
      }
    },
    function(cb2) {
      if (result.keepTesting) {
        request(apkUrl, reqOpts, cb2);
      } else {
        cb2('finished testing');
      }
    },
    function afterRequest(res, body, cb2) {
      if (result.keepTesting) {
        result.finish = new Date();

        if (res && res.statusCode) {
          result.statusCode = res.statusCode;
          if (200 !== res.statusCode) result.keepTesting = false;
          if ( !! body && body.length) {
            result.apkSize = body.length;
          }

        }
      }
      if (result.keepTesting) {
        result.cwd = path.join('/tmp/apk-regression', Math.random() + '');
        fs.mkdirSync(result.cwd);
        result.apkFilename = path.join(result.cwd, 'app.apk');
        fs.writeFile(result.apkFilename, body, {
          encoding: 'binary'
        }, cb2);
      } else {
        cb2('finished testing');
      }
    },
    function writeApkFileCb(cb2) {
      if (result.keepTesting) {
        apkToolDecode(result.cwd, result.apkFilename, cb2);
      } else {
        return cb2('finished testing');
      }
    },
    function apkDecoded(stdout, stderr, cb2) {
      if ('undefined' === typeof cb2) {
        cb2 = stdout;
      }

      if (result.keepTesting) {
        getVersion(result.cwd, cb2);
      } else {

        return cb2('finished testing');
      }
    },
    function withVersion(version, cb2) {
      result.apkVersion = version;
      checkForUpdate(owa, result, cb2);
    },
    function afterAppUpdateReq(res, body, cb2) {
      if (res && 200 === res.statusCode && body) {
        try {
          var outdated = JSON.parse(body).outdated;
          if (0 !== outdated.length) {
            console.log('Boo, detected outdated app');
            result.outdated = true;
          } else {
            console.log('Yay, up to date app');
          }
        } catch (e) {
          cb2(e);
        }
        return cb2(null);
      }
    }
  ], function(err) {
    if (err) {
      if (err.stack) {
        console.log(err.stack);
      } else {
        console.log(err);
      }
    }

    regressionDb.saveResult(config, result, function(err) {
      if (err) {
        if (err.stack) {
          console.log(err.stack);
        } else {
          console.log(err);
        }
      }
      cb(null);
    });
  });
}


var apkTool = path.join(__dirname, '..', 'lib', 'ext', 'apktool.jar');

function apkToolDecode(cwd, apk, cb) {
  var opts = {
    cwd: cwd
  };
  exec("java -jar " + apkTool + " d " + apk + " decoded", opts, cb);
}

/* Grab 1397246982 out of 
   <manifest android:versionCode="1397246982" android:versionName="1.0" package="com.mes ... */
function getVersion(cwd, cb) {
  var droidMani = path.join(cwd, 'decoded', 'AndroidManifest.xml');
  fs.readFile(droidMani, {
    encoding: 'utf8'
  }, function(err, data) {
    if (err) return cb(err);
    var start = data.indexOf('android:versionCode="') + ('android:versionCode="'.length);
    var end = data.indexOf('"', start);
    cb(null, parseInt(data.substring(start, end), 10));
  });
}

function checkForUpdate(owa, result, cb) {
  var data = {
    installed: {}
  };
  data.installed[owa.manifest_url] = result.apkVersion;
  console.log(argv.endpoint + '/app_updates', data);
  request({
    method: 'POST',
    url: argv.endpoint + '/app_updates',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  }, cb);
}
