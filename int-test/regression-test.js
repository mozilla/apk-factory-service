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

    var envId = _.find(envs, function(env) {
      console.log('Searching ', env, ' for ', argv.endpoint);
      return argv.endpoint === env.endpoint_url; });


    if (! envId) throw new Error('Unknown environment ' + argv.endpoint + ' choose from ' +
                                 _.reduce(envs, function(memo, env) {
                                   if (memo === null) {
                                     return env.endpoint_url;
                                   } else {
                                     return memo + ', ' + env.endpoint_url;
                                   }
                                 }, null));

    console.log('envId =', envId);
    console.log('envs', envs);
    console.log('owas', owas);
  }
);