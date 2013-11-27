#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require("path");
var url = require('url');

var express = require('express');
var toobusy = require('../lib/busy_middleware.js');

var _ = require("underscore");
var ApkGenerator = require("../lib/apk-generator").ApkGenerator;
var buildQueue = require("../lib/build_queue");
var log = require('../lib/logging').logger;
var metrics = require('../lib/metrics');

require('../lib/config')(function (config) {
  var app = express();
  app.use(toobusy);
  var appGenerator = function (request, response) {
    var start = new Date();

    var generator = new ApkGenerator(config.buildDir,
                                     config.cacheDir,
                                     config.force);

    var manifestUrl = request.query.manifestUrl;
    var appType = request.query.appType || "hosted";

    if (!manifestUrl) {
      metrics.badManifestUrl();
      response.send("A manifestUrl param is needed", 400);
      return;
    }

    metrics.generateApkRequest(manifestUrl);

    buildQueue(manifestUrl, function(finishedCb) {
      generator.generate(manifestUrl, null, appType, function (err, apkLoc) {
        if (err) {
  	  response.type("text/plain");
  	  response.send(err.toString(), 400);
          metrics.generationApkFailed();
          finishedCb();
  	  return;
        }
        response.status(200);
        response.type("application/vnd.android.package-archive");
        response.sendfile(apkLoc);
        metrics.generationApkFinished(new Date() - start);
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
    metrics.serverStarted();
    log.info("running on " + config.bind_address + ":" + config.server_port);
  });
});