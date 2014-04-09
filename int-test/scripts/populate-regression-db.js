#!/usr/bin/env node

/* vim: set filetype=javascript : */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  Slurp in Marketplace apps and insert into apk_factory_regressions owa table
*/



// Hit Marketplace live or used cached list of OWAs
var LIVE = false;

// number of highest .json file
var MAX_FILES = 143;

var nextUrl = 'https://marketplace.cdn.mozilla.net/api/v1/fireplace/search/featured/?cache=1&cat=&lang=en-US&region=us&vary=0';

if (false === LIVE) {
  nextUrl = 0;
}

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var optimist = require('optimist');
var request = require('request');
var Step = require('step');

var db = require('../lib/regression_db');
var sha1 = require('../../lib/sha1');

var argv = optimist
  .usage('Usage: $0 [OPTIONS]')

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

var config = vm.createContext();
vm.runInContext(fs.readFileSync(argv.config), config, argv.config);


function doNext(nextUrl) {
  if (LIVE) {
    request(nextUrl, {encoding: 'utf8'}, processResponse);
  } else {
    fs.readFile(path.resolve(__dirname, '..', 'data', 'marketplace-' + nextUrl + '.json'),
                {encoding: 'utf8'},
                processJSONFile);
  }
}

var counter = 0;
// Used for live requests against the Marketplace
function processResponse(err, res, body) {
  var results = JSON.parse(body);
  if (null === results.meta.next) {
    nextUrl = null;
  } else {
    nextUrl = 'https://marketplace.cdn.mozilla.net' + results.meta.next;
  }

  process(results);
}

// Used for cached JSON off the file system
function processJSONFile(err, data) {
  if (err) {
    throw err;
  }
  var results = JSON.parse(data);
  if (MAX_FILES >= nextUrl) {
    nextUrl++;
  } else {
    nextUrl = null;
  }
  process(results);
}

function process(results) {
  var owas = [];
  counter++;
  Step(
    function doApps() {
      if (1 !== counter) {

      } else {
        var that = this;
        results.featured.forEach(function(feature) {
          console.log('=== Featured ===', feature.slug);
          feature.apps.forEach(function(app) {
            owas.push([sha1(app.manifest_url), app.slug, app.manifest_url]);
          });
        });
      }

      results.objects.forEach(function(app) {
        owas.push([sha1(app.manifest_url), app.slug, app.manifest_url]);
      });
      db.bulkAddOWA(config, owas, this);
    },
    function next() {
      console.log('==================================');
      if (null !== nextUrl) {
        doNext(nextUrl);
      }
    }
  );
}

doNext(nextUrl);