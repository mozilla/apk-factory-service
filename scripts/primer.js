#!/usr/bin/env node

/* vim: set filetype=javascript : */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  Slurp in Marketplace apps and prime the APK Factory pump

  Mobile Only - https://marketplace.cdn.mozilla.net/api/v1/fireplace/search/?cache=1&device=mobile

  New Tab -   https://marketplace.cdn.mozilla.net/api/v1/fireplace/search/featured/?cache=1&cat=&lang=en-US&region=us&sort=reviewed&vary=0

*/

var ENDPOINT = 
  'http://localhost'; // nginx Dev
//'http://localhost:8080'; // Dev

//  'https://apk-controller.dev.mozaws.net'; // Shared Dev
//  'https://apk-controller-review.dev.mozaws.net'; // Shared Dev

// 'https://apk-controller.stage.mozaws.net'; // Stage
// 'https://apk-controller-review.stage.mozaws.net'; // Stage

// 'https://controller.apk.firefox.com'; // Prod

// Hit Marketplace live or used cached list of OWAs
var LIVE = false;
var MAX_FILES = 143;

var nextUrl = 'https://marketplace.cdn.mozilla.net/api/v1/fireplace/search/featured/?cache=1&cat=&lang=en-US&region=us&vary=0';

if (false === LIVE) {
  nextUrl = 0;
}

var fs = require('fs');
var path = require('path');

var request = require('request');
var Step = require('step');

function doNext(nextUrl) {
  if (LIVE) {
    request(nextUrl, {encoding: 'utf8'}, processResponse);
  } else {
    fs.readFile(path.resolve(__dirname, '..', 'int-test', 'data', 'marketplace-' + nextUrl + '.json'),
                {encoding: 'utf8'},
                processJSONFile);
  }
}

function requestWithContext(url, slug, cb) {
  var start = new Date();
  request(url, {strictSSL: false}, function(err, res, body) {
    var statusCode = 0;
    if (res && res.statusCode) statusCode = res.statusCode;
    console.log(slug, '\t', statusCode, new Date() - start, err, '\t', url);
    cb(null);
  });
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
  console.log('======= Page ' + counter + ' ======');
  counter++;
  Step(
    function doFeatured() {
      if (1 !== counter) {
        this(null);
      } else {
      //var group = this.group();
        var that = this;
      results.featured.forEach(function(feature) {
        console.log('=== Featured ===', feature.slug);
        feature.apps.forEach(function(app) {
          //requestWithContext(makeUrl(app.manifest_url), app.slug, group());
          requestWithContext(makeUrl(app.manifest_url), app.slug, that.parallel());
        });
      });
      }
    },
    function doCatalog(err) {
      //var group = this.group()
        var that = this;
      console.log('=== Catalog ===');
      results.objects.forEach(function(app) {
        requestWithContext(makeUrl(app.manifest_url), app.slug, that.parallel());
      });
    },
    function next() {
      console.log('==================================');
      if (null !== nextUrl) {
        doNext(nextUrl);
      }
    }
  );
}

function makeUrl(manifestUrl) {
  return ENDPOINT + '/application.apk?manifestUrl=' +
    encodeURIComponent(manifestUrl);
}

doNext(nextUrl);