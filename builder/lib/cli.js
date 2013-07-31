#!/usr/bin/env node
"use strict";
var optimist = require("optimist"),
    fs = require("fs.extra"),
    _ = require("underscore"),
    path = require("path"),
    url = require("url"),
    apk = require("./apk-project-builder");

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


var loader, dirname, manifestFilename, manifestUrl = argv.manifest;
if (/^\w+:\/\//.test(manifestUrl)) {
  dirname = url.resolve(manifestUrl, ".");
  manifestFilename = _(url.parse(manifestUrl).pathname.split("/")).last();
} else {
  dirname = path.dirname(path.resolve(process.cwd(), manifestUrl));
  manifestFilename = path.basename(manifestUrl);
}
manifestUrl = argv.overideManifest || manifestUrl;
var loader = require("./file-loader").create(dirname);
var projectBuilder = new apk.ApkProjectCreator("template", argv.tmpDir, loader);

function createDir(defaultDir, dir) {
  dir = dir || defaultDir;
  dir = path.resolve(__dirname, "..", dir);
  fs.mkdirRecursiveSync(dir);
  return dir;
}


loader.load(manifestFilename, function (err, string) {
  if (err) {
    console.error("Cannot load manifest: " + err);
    return;
  }
  try {
    var manifest = JSON.parse(string);
    projectBuilder.create(manifestUrl, manifest, function () {
      projectBuilder.build(createDir("cache/keys"), function (err, apkLoc) {

        if (!err) {
          var androidifier = require("./manifest-androidifier"),
              packageName = androidifier.packageName(manifestUrl),
              cacheDir = createDir("cache/apks/" + packageName),
              cachedFile = path.join(cacheDir, "application.apk");
          if (fs.existsSync(cachedFile)) {
            fs.unlinkSync(cachedFile);
          }
          fs.linkSync(apkLoc, cachedFile);
          console.log(cachedFile);
        }
      });
    });

  } catch (e) {
    console.error("String received was: " + string);
    if (e.stack) {
      console.error(e.stack);
    }
  }
});
