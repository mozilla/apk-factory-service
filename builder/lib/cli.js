#!/usr/bin/env node
"use strict";
var optimist = require("optimist"),
    path = require("path"),
    fs = require("fs");

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
    .option('type', {
        alias: "t",
        desc: "The type of app (hosted or packaged; default: hosted)",
        default: "hosted"
    })
    .option('tmpDir', {
        alias: "d",
        desc: "Use this directory as the temporary project directory",
        default: path.resolve(process.env.TMPDIR || process.cwd(), "app")
    })
    .option("output", {
        alias: "o",
        desc: "The output APK filename"
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

var ApkGenerator = require("./apk-generator").ApkGenerator,
    generator = new ApkGenerator(argv.tmpDir);


generator.generate(argv.manifest, argv.overideManifest, argv.type, function (err, apkLoc) {
  var output;
  if (!err) {

    if (argv.output) {
      output = path.resolve(process.cwd(), argv.output);
      if (fs.existsSync(output)) {
        fs.unlinkSync(output);
      }
      fs.linkSync(apkLoc, output);
    }
  } else {
    console.error(err);
  }

});
