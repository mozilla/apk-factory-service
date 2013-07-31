#!/usr/bin/env node
"use strict";
var optimist = require("optimist"),
    fs = require("fs"),
    _ = require("underscore"),
    path = require("path"),
    url = require("url"),
    apk = require("./skeleton-builder");

    fs.existsSync = fs.existsSync || require("path").existsSync;


var argv = optimist
    .usage('Usage: $0 {OPTIONS}')
    .wrap(80)
    .option('manifest', {
        alias: "m",
        desc: "The URL or path to the manifest"
    })
    .option('overideManifest', {
        desc: "The URL or path to the manifest"
    })
    .option('tmpDir', {
        alias: "d",
        desc: "Use this directory as the temporary project directory",
        default: path.resolve(process.env.TMPDIR, "app")
    })
    .option('help', {
        alias: "?",
        desc: "Display this message",
        boolean: true
    })
    .check(function (argv) {
        if (argv.help) {
            throw "";
        }

        if (!argv.manifest) {
          throw "Must specify a manifest location";
        }

    })
    .argv;


var loader, dirname, manifestFilename;
if (/^\w+:\/\//.test(argv.manifest)) {
  dirname = url.resolve(argv.manifest, ".");
  manifestFilename = _(url.parse(argv.manifest).pathname.split("/")).last();
} else {
  dirname = path.dirname(path.resolve(process.cwd(), argv.manifest));
  manifestFilename = path.basename(argv.manifest);
}

var manifestUrl = argv.overideManifest || argv.manifest;
var loader = require("./file-loader").create(dirname);
var projectBuilder = new apk.ApkProjectCreator("template", argv.tmpDir, loader);

loader.load(manifestFilename, function (err, string) {
  if (err) {
    console.error("Cannot load manifest: " + err);
    return;
  }
  try {
    var manifest = JSON.parse(string);
    projectBuilder.create(manifestUrl, manifest);
  } catch (e) {
    console.error("String received was: " + string);
    if (e.stack) {
      console.error(e.stack);
    }
  }
});
