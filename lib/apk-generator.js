/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require("underscore"),
url = require("url"),
fs = require("fs.extra"),
path = require("path"),
stream = require("stream"),

request = require("request");

function createDir(cacheDir, dir) {
  var aDir = path.resolve(cacheDir, dir);
  fs.mkdirRecursiveSync(aDir);
  return aDir;
}


function ApkGenerator (buildDir, forceRebuild, debug) {
  this.buildDir = buildDir || process.env.TMPDIR;
  this.forceRebuild = forceRebuild;
  this.debug = debug;
}

_.extend(ApkGenerator.prototype, {

  generate: function (manifestUrl, overideManifestPath, appType, cacheDir, projectBuilder, appBuildDir, manifest, miniManifest, zipFileLocation, cb) {

    // TODO Fix and remove this
    if (arguments.length === 2 && _.isFunction(overideManifestPath)) {
      cb = overideManifestPath;
      overideManifestPath = undefined;
    }

    var self = this;

    projectBuilder.create(manifestUrl, manifest, appType, onCreate);

    function onCreate (androidManifestProperties) {
      console.log("Building " + androidManifestProperties.packageName + "-" + androidManifestProperties.version + ".apk (" + androidManifestProperties.versionCode + ") from " + manifestUrl);

      if (zipFileLocation) {
        var rawDir = path.join(projectBuilder.dest, "res/raw");
        var newZipFileLocation = path.join(rawDir, "application.zip");
        require("./file-loader").ensureDirectoryExistsFor(newZipFileLocation);
        fs.renameSync(zipFileLocation, newZipFileLocation);

        fs.writeFileSync(path.join(rawDir, "mini.json"), JSON.stringify(miniManifest));
      }
      var keysDir = createDir(cacheDir, "keys");
      projectBuilder.build(keysDir, function (err, apkLoc) {
        if (cb) {
          cb(err, apkLoc);
        }
        if (!err && !self.debug) {
          projectBuilder.dest = appBuildDir;
          projectBuilder.cleanup();
        }
      });
    }
  }
});


module.exports = {
  ApkGenerator: ApkGenerator
};
