
var _ = require("underscore"),
    fs = require("fs.extra"),
    path = require("path"),
    nunjucks = require("nunjucks");


var ApkProject = function (src, dest, loader) {
  dest = dest || (process.env.TMPDIR + "/app");

  this.src = path.resolve(process.cwd(), src);
  this.dest = path.resolve(process.cwd(), dest);

  this.env = new nunjucks.Environment([new nunjucks.FileSystemLoader(this.src)]);

  this.loader = loader;
};

_.extend(ApkProject.prototype, {
  _makeNewSkeleton: function (cb) {
    if (!fs.existsSync(this.dest)) {
      try {
        fs.mkdirpSync(this.dest);
      } catch(e) {
        throw e;
      }
    }

    fs.copyRecursive(this.src, this.dest, cb);
  },

  _templatize: function (filesuffix, destFileSuffix, obj) {
    if (arguments.length === 2) {
      obj = destFileSuffix;
      destFileSuffix = filesuffix;
    }
    var out = this.env.render(filesuffix, obj);
    this.loader.write(path.resolve(this.dest, destFileSuffix), out);
  },

  create: function (manifestUrl, manifest, cb) {
    if (_.isObject(manifest) && _.isString(manifestUrl)) {
      // continue;
    } else {
      throw "A JSON manifest is required, with a valid manifestUrl";
    }

    var self = this,
        androidify = require("./manifest-androidifier");
    self._makeNewSkeleton(function (err) {
      if (err) {
        if (cb) {
          cb(err);
        } else {
          console.error(err);
        }
        return;
      }


      self._templatize("AndroidManifest.xml", {
        version: manifest.version,
        versionCode: androidify.versionCode(manifest.version),
        manifestUrl: manifestUrl,
        permissions: androidify.permissions(manifest.permissions),
        packageName: androidify.packageName(manifestUrl)
      });

      var stringsObj = {
        name: manifest.name,
        description: manifest.description || ""
      };

      if (manifest.default_locale && manifest.locales) {
        _.each(manifest.locales, function (i, locale) {
          var localizedStrings = _.extend({}, stringsObj, manifest.locales[locale]);
          self._templatize("res/values/strings.xml",
                          "res/values-" + locale +  "/strings.xml",
                          localizedStrings);
        });

        var localizedStrings = _.extend({}, stringsObj, manifest.locales[manifest.default_locale]);
        self._templatize("res/values/strings.xml", localizedStrings);

      } else {
        self._templatize("res/values/strings.xml", stringsObj);
      }

      function downloaderCallback () {}

      var icons = manifest.icons || {};
      _.each(icons, function (i, key) {
        var dest = path.join(self.dest, "res/drawable-" + androidify.iconSize(key) + "/ic_launcher.png");
        self.loader.copy(icons[key], dest, downloaderCallback);
      });




    });
  }

});


var manifestUrl = "http://wfwalker.github.io/opensun/online.webapp";

var loader = require("./file-loader").create(
    "samples");
    //manifestUrl);

var projectBuilder = new ApkProject("templates", "/tmp/test-app", loader);



loader.load("sample-localized.manifest", function (err, string) {
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



module.exports = {

};