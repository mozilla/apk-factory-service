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
    var that = this;

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

    var group = that.group();
    testApk(argv, owas, curEnv, group());
  },
  function(err, results) {
    console.log('Finished all', err, results);
  }
);

function makeUrl(baseUrl, manifestUrl) {
  return baseUrl + '/application.apk?manifestUrl=' +
    encodeURIComponent(manifestUrl);
}

function testApk(argv, owas, curEnv, cb) {
  var reqOpts = {
    strictSSL: false,
    encoding: null
  };
  owas.forEach(function(owa) {
    var apkUrl = makeUrl(argv.endpoint, owa.manifest_url);
    var result = {
      envId: curEnv.id,
      owaId: owa.id,
      start: new Date().getTime(),
      validJar: false
    };

    Step(
      function() {
        console.log('Requesting ', apkUrl);
        request(apkUrl, reqOpts, this);
        // TODO result.hosted

      },
      function afterRequest(err, res, body) {
        result.finish = new Date().getTime();
        console.log('after request', err, body.length);
        // TODO error handling during these regression runs
        if (err) throw err;
        result.statusCode = res.statusCode;
        if (200 !== res.statusCode) throw new Error('Wrong status code, expected 200 got ' +

                                                    res.statusCode);

        if (!! body && body.length) {
          result.apkSize = body.length;
        }

        cb(null, result);
      }
    );
  });
}