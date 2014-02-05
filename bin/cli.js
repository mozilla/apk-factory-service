#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var fs = require('fs');
var path = require('path');
var url = require('url');

var optimist = require('optimist');
var request = require('request');

var fileLoader = require('../lib/file_loader');
var frontController = require('../lib/front_controller');
var owaDownloader = require('../lib/owa_downloader');

var argv = optimist
  .usage('Usage: $0 {OPTIONS}')
  .wrap(80)
  .option('overideManifest', {
    desc: "The URL or path to the manifest"
  })
  .option('endpoint', {
    desc: "The URL for the APK Factory Service",
  default: "https://apk-review.mozilla.org"
  })
  .option('help', {
    alias: "?",
    desc: "Display this message",
    boolean: true
  })
  .check(function(argv) {
    if (argv.help) {
      throw "";
    } else if (argv._.length < 2) {
      throw "";
    }
    argv.manifest = argv._[0];
    argv.output = argv._[1];
    if (-1 === argv.manifest.indexOf('://')) {
      if (! argv.overideManifest) {
        console.log('local manifest file should be used with --overideManifest option');
        argv.help();
        process.exit(1);
      }
    }
  })
  .argv;

require('../lib/config')(function(config) {
  // manifest is used for owaDownloader
  var manifestUrl = argv.manifest;
  var loaderDirname;

  if (/^\w+:\/\//.test(manifestUrl)) {
    loaderDirname = url.resolve(manifestUrl, ".");
  } else {
    loaderDirname = path.dirname(path.resolve(process.cwd(), manifestUrl));
    console.log('loaderDirname', loaderDirname);
  }

  var loader = fileLoader.create(loaderDirname);

  // TODO AOK refactor and remove app Build Dir
  var appBuildDir = '';
  owaDownloader(argv.manifest, argv.overideManifest, loader, appBuildDir, owaCb);

  function owaCb(err, manifest, appType, zip) {
    if (err) {
      return console.error(err);
      process.exit(1);
    }
    if (!! argv.overideManifest) {
      manifestUrl = argv.overideManifest;
    }
    cliClient(manifestUrl, manifest, zip, argv, function(err, apk) {
      var output;
      if (!err) {
        if (argv.output) {
          output = path.resolve(process.cwd(), argv.output);
          fs.writeFile(output, apk, {encoding: 'binary'}, function(err) {
            if (err) {
              console.log(err);
              process.exit(1);
            }
          });
        }
      } else {
        console.error(err);
      }
    });
  }
});

function cliClient(manifestUrl, manifest, zip, argv, cb) {
  var body = JSON.stringify({
    manifestUrl: manifestUrl,
    manifest: manifest,
    packageZip: zip
  });
  request({
    url: argv.endpoint + '/cli_build',
    method: 'POST',
    body: body,
    headers: {
      "Content-Type": "application/json"
    }
  }, function(err, res, body) {
    if (err || 200 !== res.statusCode) {
      cb(err || 'Generator response status code was ' + res.statusCode);
    } else {
      var data = JSON.parse(body);
      if ('okay' === data.status) {
        cb(null, new Buffer(data.apk, 'base64').toString('binary'));
      } else {
        cb('Error in generator - ' + body);      
      }
    }
  });
}