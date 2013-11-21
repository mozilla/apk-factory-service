/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require("underscore"),
    url = require("url"),
    fs = require("fs.extra"),
    path = require("path"),
    stream = require("stream"),
    unzip = require("unzip"),
    request = require("request"),

    apk = require("./apk-project-builder");

function createDir(defaultDir, dir) {
  dir = dir || defaultDir;
  dir = path.resolve(this.cacheDir, dir);
  fs.mkdirRecursiveSync(dir);
  return dir;
}


function ApkGenerator (buildDir, cacheDir, forceRebuild, debug) {
  this.buildDir = buildDir || process.env.TMPDIR;
  if (cacheDir) {
    this.cacheDir = path.resolve(process.cwd(), cacheDir);
  } else {
    this.cacheDir = path.resolve(__dirname, "..", "cache");
  }
  this.forceRebuild = forceRebuild;
  this.debug = debug;

}

_.extend(ApkGenerator.prototype, {

  generate: function (manifestUrl, overideManifestPath, appType, cb) {

    if (arguments.length === 2 && _.isFunction(overideManifestPath)) {
      cb = overideManifestPath;
      overideManifestPath = undefined;
    }

    var self = this,
        androidifier = require("./manifest-androidifier"),
        packageName = androidifier.packageName(manifestUrl),
        loader, dirname, manifestFilename, projectBuilder,
        appBuildDir = path.join(this.buildDir, packageName);

    if (/^\w+:\/\//.test(manifestUrl)) {
      dirname = url.resolve(manifestUrl, ".");
      manifestFilename = _(url.parse(manifestUrl).pathname.split("/")).last();
    } else {
      dirname = path.dirname(path.resolve(process.cwd(), manifestUrl));
      manifestFilename = path.basename(manifestUrl);
    }
    manifestUrl = overideManifestPath || manifestUrl;

    var cacheDir, cachedFile;
    if (self.cacheDir) {
      cacheDir = self.createDir("apks/" + packageName);
      cachedFile = path.join(cacheDir, "application.apk");


      if (!this.forceRebuild && fs.existsSync(cachedFile)) {
        if (cb) {
          cb(null, cachedFile);
        }
        return;
      }
    }



    loader = require("./file-loader").create(dirname);
    projectBuilder = new apk.ApkProjectCreator("template", appBuildDir, loader);


    loader.load(manifestFilename, function (err, string) {
      if (err) {
        console.error("Cannot load manifest: " + err);
        return;
      }
      try {
        var manifest = JSON.parse(string),
            zipFileLocation,
            miniManifest;
        if (!!manifest.package_path) {
          appType = "packaged";
        } else {
          appType = "hosted";
        }

        if (appType == "hosted") {
          create();
        } else {
          var extractDir = path.join(appBuildDir, "package");
          fs.mkdirRecursiveSync(extractDir);

          zipFileLocation = path.join(appBuildDir, "application.zip");

          function fetchPackage() {
            var writer = fs.createWriteStream(zipFileLocation, {
                            flags: 'w',
                            encoding: null,
                            mode: 0666 }
            );
            writer.on("error", function(err) { console.error(err) });
            writer.on("close", unzipPackage);
            var packagePath = url.resolve(manifestUrl, manifest.package_path);
            request(packagePath).pipe(writer);
          }

          function unzipPackage() {
            var extractPackage = unzip.Extract({ path: extractDir, verbose: false });
            extractPackage.on("error", function(err) { console.error(err) });
            extractPackage.on("close", onCloseExtractPackage);
            fs.createReadStream(zipFileLocation).pipe(extractPackage);
          }
          fetchPackage();


          function onCloseExtractPackage() {
            // Reset where we're going to create the android project.
            projectBuilder.dest = path.join(projectBuilder.dest, "apk-build");

            // Reset where we're going to get the image files from.
            loader = require("./file-loader").create(extractDir);
            projectBuilder.loader = loader;

            // Use the zipfile's version of the manifest.
            // TODO what if the manifest isn't valid?
            var packageManifestData = loader.load("manifest.webapp");
            miniManifest = manifest;
            manifest = JSON.parse(packageManifestData);

            create();
          }
        }

        function create() {
          projectBuilder.create(manifestUrl, manifest, appType, onCreate);
        }

        function onCreate (androidManifestProperties) {
          console.log("Building " + androidManifestProperties.packageName + "-" + androidManifestProperties.version + ".apk (" + androidManifestProperties.versionCode + ") from " + manifestUrl);

          if (zipFileLocation) {
            var rawDir = path.join(projectBuilder.dest, "res/raw");
            var newZipFileLocation = path.join(rawDir, "application.zip");
            require("./file-loader").ensureDirectoryExistsFor(newZipFileLocation);
            fs.renameSync(zipFileLocation, newZipFileLocation);

            fs.writeFileSync(path.join(rawDir, "mini.json"), JSON.stringify(miniManifest));
          }

          projectBuilder.build(self.createDir("keys"), function (err, apkLoc) {

            if (!err) {
              if (self.cacheDir) {

                if (fs.existsSync(cachedFile)) {
                  fs.unlinkSync(cachedFile);
                }
                fs.linkSync(apkLoc, cachedFile);
                apkLoc = cachedFile;
              }
            }
            if (cb) {
              cb(err, apkLoc);
            }
            if (!err && !self.debug) {
              projectBuilder.dest = appBuildDir;
              projectBuilder.cleanup();
            }
          });
        }

      } catch (e) {
        if (e.stack) {
          console.error("Error building " + manifestUrl);
          console.error(e.stack);
        }
        if (cb) {
          cb(e);
        }



      }
    });


  },

  createDir: function (defaultDir, dir) {
    dir = dir || defaultDir;
    dir = path.resolve(this.cacheDir, dir);
    fs.mkdirRecursiveSync(dir);
    return dir;
  }

});


module.exports = {
  ApkGenerator: ApkGenerator
};
