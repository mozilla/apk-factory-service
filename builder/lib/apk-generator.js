var _ = require("underscore"),
    url = require("url"),
    fs = require("fs.extra"),
    path = require("path"),

    apk = require("./apk-project-builder");

function createDir(defaultDir, dir) {
  dir = dir || defaultDir;
  dir = path.resolve(this.cacheDir, dir);
  fs.mkdirRecursiveSync(dir);
  return dir;
}


function ApkGenerator (buildDir, cacheDir, forceRebuild) {
  this.buildDir = buildDir || process.env.TMPDIR;
  if (cacheDir) {
    this.cacheDir = path.resolve(process.cwd(), cacheDir);
  } else {
    this.cacheDir = path.resolve(__dirname, "..", "cache");
  }
  this.forceRebuild = forceRebuild;

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
        var manifest = JSON.parse(string);
        projectBuilder.create(manifestUrl, manifest, appType, function (androidManifestProperties) {

          console.log("Building " + androidManifestProperties.packageName + "-" + androidManifestProperties.version + " (" + androidManifestProperties.versionCode + ") from " + manifestUrl);

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
            if (!err) {
              projectBuilder.cleanup();
            }
          });
        });
      } catch (e) {
        if (e.stack) {
          console.error("Error building " + manifestUrl);
          console.error(e.stack);
        }
        if (cb) {
          cb(e);
        }
        if (!err) {
          projectBuilder.cleanup();
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
