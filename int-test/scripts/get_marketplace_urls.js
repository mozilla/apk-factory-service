#!/usr/bin/env node

/* vim: set filetype=javascript : */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  Download all Marketplace urls

  Mobile Only - https://marketplace.cdn.mozilla.net/api/v1/fireplace/search/?cache=1&device=mobile

  New Tab -   https://marketplace.cdn.mozilla.net/api/v1/fireplace/search/featured/?cache=1&cat=&lang=en-US&region=us&sort=reviewed&vary=0

*/

var nextUrl = 'https://marketplace.cdn.mozilla.net/api/v1/fireplace/search/featured/?cache=1&cat=&lang=en-US&region=us&vary=0';

var fs = require('fs');
var path = require('path');

var request = require('request');
var Step = require('step');

function doNext(nextUrl) {
  request(nextUrl, {
    encoding: 'utf8'
  }, processResponse);
}

var counter = 0;

function processResponse(err, res, body) {
  fs.writeFileSync('marketplace-' + counter + '.json', body, {
    encoding: 'utf8'
  });

  var results = JSON.parse(body);
  if (null === results.meta.next) {
    nextUrl = null;
  } else {
    nextUrl = 'https://marketplace.cdn.mozilla.net' + results.meta.next;
  }

  counter++;
  if (null !== nextUrl) {
    doNext(nextUrl);
  }
}

doNext(nextUrl);
