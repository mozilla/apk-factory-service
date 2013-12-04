var fs = require('fs.extra');
var path = require('path');
var url = require('url');

var _ = require('underscore');
var request = require('request');
var unzip = require('unzip');

var fileLoader = require('./file-loader');

module.exports = function(manifestUrl, projectBuilder, appBuildDir, cb) {

  var manifestFilename;
  if (/^\w+:\/\//.test(manifestUrl)) {
    manifestFilename = _(url.parse(manifestUrl).pathname.split("/")).last();
  } else {
    manifestFilename = path.basename(manifestUrl);
  }

  projectBuilder.loader.load(manifestFilename, function (err, string) {
    if (err) {
      console.error("Cannot load manifest: " + err);
      return;
    }
    try {                

      var manifest = JSON.parse(string),
      zipFileLocation;

      if (!!manifest.package_path) {
        appType = "packaged";
      } else {
        appType = "hosted";
      }

      if (appType == "hosted") {
        return cb(null, projectBuilder, manifest, zipFileLocation);
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
          loader = fileLoader.create(extractDir);
          projectBuilder.loader = loader;

          // Use the zipfile's version of the manifest.
          // TODO what if the manifest isn't valid?
          var packageManifestData = loader.load("manifest.webapp");
          var miniManifest = manifest;
          manifest = JSON.parse(packageManifestData);

          return cb(null, projectBuilder, manifest, miniManifest, zipFileLocation);
        }
      }
    } catch (e) {
      if (e.stack) {
        console.error("Error downloading " + manifestUrl);
        console.error(e.stack);
      }
      if (cb) {
        cb(e);
      }
    }
  });
};