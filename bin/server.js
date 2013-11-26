#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require("path");
var url = require('url');

var express = require('express');

var _ = require("underscore");
var ApkGenerator = require("../lib/apk-generator").ApkGenerator;
var buildQueue = require("../lib/build_queue");
var log = require('../lib/logging').logger;

require('../lib/config')(function (config) {
  var app = express();
  var appGenerator = function (request, response) {

    var generator = new ApkGenerator(config.buildDir,
                                     config.cacheDir,
                                     config.force);

    var manifestUrl = request.query.manifestUrl;
    var appType = request.query.appType || "hosted";

    if (!manifestUrl) {    
      response.send("A manifestUrl param is needed", 400);
      return;
    }

    buildQueue(manifestUrl, function(finishedCb) {
      generator.generate(manifestUrl, null, appType, function (err, apkLoc) {
        if (err) {
  	  response.type("text/plain");
  	  response.send(err.toString(), 400);
          finishedCb();
  	  return;
        }
        response.status(200);
        response.type("application/vnd.android.package-archive");
        response.sendfile(apkLoc);
        finishedCb();
      });
    });
  };

  app.get('/application.apk', appGenerator);

  var indexFile = function (request, response) {
    response.status(200);
    response.type("text/text");
    response.send("200 Server OK");
  };
  app.get("/", indexFile);
  app.get("/index.html", indexFile);

  app.listen(config.server_port, config.bind_address, function() {
    log.info("running on " + config.bind_address + ":" + config.server_port);
  });
});