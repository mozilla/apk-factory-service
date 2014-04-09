#!/usr/bin/env node

/* vim: set filetype=javascript : */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  Given an environment, test all OWA
*/

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var _ = require('underscore');
var optimist = require('optimist');
var request = require('request');
var Step = require('step');

var regressionDb = require('./lib/regression_db');

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

var config = vm.createContext();
vm.runInContext(fs.readFileSync(argv.config), config, argv.config);

Step(
  function loadEnvsOWAs() {
    regressionDb.envs(config, this.parallel());
    regressionDb.owas(config, this.parallel());
  },
  function (err, envs, owas) {
    if (err) throw err;
    console.log('Potentially testing ' + owas.length + ' apps');

    var curEnv = _.find(envs, function(env) {
      return argv.endpoint === env.endpoint_url;
    });

    if (! curEnv) throw new Error('Unknown environment ' + argv.endpoint + ' choose from ' +
                                  _.reduce(envs, function(memo, env) {
                                    if (memo === null) {
                                      return env.endpoint_url;
                                    } else {
                                      return memo + ', ' + env.endpoint_url;
                                    }
                                  }, null));

    testApks(argv, owas, curEnv, this);
  },
  function(err) {
    if (err && err.stack) { console.log(err.stack); }
    console.log('Finished all', err);
// TODO this should loop, re-read db... etc
  }
);

function makeUrl(baseUrl, manifestUrl) {
  return baseUrl + '/application.apk?manifestUrl=' +
    encodeURIComponent(manifestUrl);
}

function testApks(argv, owas, curEnv, cb) {
  var reqOpts = {
    strictSSL: false,
    encoding: null
  };

  Step(
    function() {

      var group = this.group();
      owas.slice(0, 5).forEach(function(owa) {
        var apkUrl = makeUrl(argv.endpoint, owa.manifest_url);
        var result = {
          envId: curEnv.id,
          owaId: owa.id,
          start: new Date(),
          hosted: true,
          validJar: false,
          statusCode: 0,
          apkSize: 0,
          keepTesting: true // State of this test run
        };

        testApk(apkUrl, owa, result, group());
      });
    }, function(err) {
      cb(null);
    }
  );
  function testApk(apkUrl, owa, result, cb) {
    Step(
      function getMiniManifest() {
        request(owa.manifest_url, {encoding: 'utf8'}, this);
      },
      function recordManifest(err, res, body) {
        if (err) {
          result.err = 'Error requesting mini-manifest ' + err.toString();
          result.keepTesting = false
        } else {
          try {
            var miniMani = JSON.parse(body);
            if (miniMani.package_path && miniMani.package_path.length > 0) {
              result.hosted = false;
            }
          } catch(e) {
            result.err = 'Error parsing mini-manifest ' + e.toString() + ' original=' + body;
            result.keepTesting = false
          }
        }
        this(null);
      },
      function() {
        if (result.keepTesting) {
          console.log('Requesting ', apkUrl);
          request(apkUrl, reqOpts, this);
        } else {
          this(null);
        }
      },
      function afterRequest(err, res, body) {
        if (result.keepTesting) {
          result.finish = new Date();
          if (err) {
            result.err = 'Error requesting apk ' + err.toString();
            result.keepTesting = false
          }
          if (res && res.statusCode) {
            result.statusCode = res.statusCode;
            if (200 !== res.statusCode) result.keepTesting = false;
          }      

          if (!! body && body.length) {
            result.apkSize = body.length;
          }
        } else {
          this(null);
        }

        regressionDb.saveResult(config, result, cb);
      }
    );
  }
}