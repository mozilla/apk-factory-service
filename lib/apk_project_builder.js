/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var crypto = require('crypto');
var exec = require('child_process').exec;
var path = require('path');

var _ = require('underscore');
var fs = require('fs.extra');
var jucks = require('nunjucks');

var androidify = require('./manifest_androidifier');
var fsUtil = require('./fs_util');
var s3 = require('./s3');
var signer = require('./apk_signer_client');
var xmlEscape = require('./xml_escape');

var APK_FAC_LIB_PATH = "./ext/apk-factory-library/";

var ApkProject = function(src, dest) {
  dest = dest || (process.env.TMPDIR + "/app");

  var tmplPath = path.resolve(__dirname, "..", "util-templates");

  this.src = path.resolve(__dirname, APK_FAC_LIB_PATH, src);
  this.dest = path.resolve(process.cwd(), dest);

  this.env = new jucks.Environment([new jucks.FileSystemLoader(this.src),
                                    new jucks.FileSystemLoader(tmplPath)]);

};

_.extend(ApkProject.prototype, {
  _makeNewSkeleton: function(cb) {

    try {
      fs.mkdirpSync(this.dest);
    } catch(e) {
      throw e;
    }

    this.dest = fs.realpathSync(this.dest);
    fs.copyRecursive(this.src, this.dest, cb);

    // Create the src/ subdirectory, which ant needs to build the project,
    // but which doesn't exist in the template because it's empty (and you
    // can't control the revisions of a directory in Git).
    fs.mkdirpSync(path.resolve(this.dest, "src"));

    // Copy the library over also Bug#974199
    var buildDir = path.dirname(this.dest);
    var projectName = path.basename(this.dest);
    this.destLibrary = path.join(buildDir, projectName + "-library");
    var librarySource = path.resolve(__dirname, 'ext', 'apk-factory-library');
    fs.rmrfSync(this.destLibrary);
    fs.mkdirpSync(this.destLibrary);
    fs.copyRecursive(librarySource, this.destLibrary, function(err) {
      if (err) {
        console.error('Problems while creating a copy of the library');
        console.error(err);
      }
    });
  },

  _templatize: function(filesuffix, destFileSuffix, obj) {
    if (arguments.length === 2) {
      obj = destFileSuffix;
      destFileSuffix = filesuffix;
    }



    var out = this.env.render(filesuffix, obj),
    fileout = path.resolve(this.dest, destFileSuffix);

    if (fs.existsSync(fileout)) {
      fs.unlinkSync(fileout);
    }
    writeFileSync(fileout, out);
  },

  create: function(manifest, version, loader, cb) {
    if (_.isObject(manifest.data) && _.isString(manifest.url)) {
      // continue;
    } else {
      throw "A JSON manifest is required, with a valid manifestUrl";
    }

    var self = this;

    self.manifestUrl = manifest.url;
    self.manifest = manifest.data;

    self._makeNewSkeleton(function(err) {
      if (err) {
        if (cb) {
          cb(err);
        } else {
          console.error(err);
        }
        return;
      }

      var androidManifestProperties = {
        version: manifest.data.version,
        versionCode: version,
        manifestUrl: manifest.url,
        appType: manifest.appType,
        permissions: androidify.permissions(manifest.data.permissions),
        packageName: androidify.packageName(manifest.url)
      };

      self._templatize("AndroidManifest.xml", androidManifestProperties);

      var stringsObj = {
        name: xmlEscape(manifest.data.name),
        description: xmlEscape(manifest.data.description) || ""
      }, re = /^(\w+)(?:-(\w+))?$/mg;

      if (manifest.data.default_locale && manifest.data.locales) {
        _.each(manifest.data.locales, function(i, locale) {
          var localizedStrings =
            _.extend({}, stringsObj, manifest.data.locales[locale]);

          locale = locale.replace(re,
                                  function(match, lang, country) {
                                    if (lang.length > 2) {
                                      return null;
                                    }
                                    if (country) {
                                      return lang + "-r" + country.toUpperCase();
                                    }
                                    return lang;
                                  }
                                 );
          if (!! localizedStrings.name) {
            localizedStrings.name = xmlEscape(localizedStrings.name);
          }
          if (!! localizedStrings.description) {
            localizedStrings.description = xmlEscape(localizedStrings.description);
          }
          if (locale === "value-null") {
            self._templatize("res/values/strings.xml",
                             "res/values-" + locale +  "/strings.xml",
                             localizedStrings);
          }
        });

        var manLocales = manifest.data.locales[manifest.data.default_locale];
        var localizedStrings = _.extend({}, stringsObj, manLocales);
        self._templatize("res/values/strings.xml", localizedStrings);

      } else {
        self._templatize("res/values/strings.xml", stringsObj);
      }

      self._templatize("build.xml", self._sanitize(stringsObj));

      writeFileSync(
        path.join(self.dest,
                  "res/raw/manifest.json"),
        JSON.stringify(manifest.data));

      var icons = manifest.data.icons || {};
      var iconsLeft = _.size(icons);

      if (!iconsLeft) {
        // strange!
        cb(androidManifestProperties);
      }

      function downloaderCallback () {
        iconsLeft --;
        if (iconsLeft <= 0 && _.isFunction(cb)) {
          cb(androidManifestProperties);
        }
      }

      _.each(icons, function(i, key) {
        var launcher = "res/drawable-" + androidify.iconSize(key) +
          "/ic_launcher.png";
        var dest = path.join(self.dest, launcher);
        loader.copy(icons[key], dest, downloaderCallback);
      });
    });
  },

  _sanitize: function(value) {
    if (_.isString(value)) {
      return value.replace(/[^\w\.]+/g, "");
    }

    var self = this;
    _.each(value, function(i, key) {
      value[key] = self._sanitize(value[key]);
    });
    return value;
  },

  build: function(keyDir, manifestUrl, packageName, cb) {
    var self = this;
    var libProj = path.relative(self.dest, this.destLibrary);    

    var projectProperties = {
      libraryProject: libProj
    };

    self._templatize("project.properties", projectProperties);

    function buildWithAnt() {
      exec("(cd " + self.dest + "; ant release)", antCb);
    }

    function antCb(error, stdout, stderr) {
      var unsignedPath = self._sanitize(
        xmlEscape(
          self.manifest.name)) + "-release-unsigned.apk";
      var apkLocation = path.join(self.dest, "bin", unsignedPath);
      var releasePath = packageName + '.apk';

      if (error) {
        console.error(error);
        console.error(stderr);
        return cb(error);
      }

      var manifestHash = sha1(manifestUrl);
      signApk(manifestHash, apkLocation, unsignedPath, releasePath, cb);
    }
    buildWithAnt();
  },

  cleanup: function() {
    fs.rmrfSync(this.dest);
    fs.rmrfSync(this.destLibrary);
  }

});

function signApk(id, apkLocation, unsignedApkPath, signedApkPath, cb) {

  // Get SHA256 hash...
  // Store on S3
  // Call Signer service
  // return APK location



  var shasum = crypto.createHash('sha256');


  fs.stat(apkLocation, function(err, stat) {
    if (err) {
      console.log('stat failed for ', apkLocation);
      console.error(err);
      return cb(err);
    }
    fs.readFile(apkLocation,
                {},
                function(err, data) {
                  if (err) {
                    console.log('read file failed for ', apkLocation);
                    console.error(err);
                    return cb(err);
                  }
                  shasum.update(data);
                  var unsignedApkHash = shasum.digest('hex');
                  s3.saveApk(unsignedApkPath, data, stat.size, function(res) {
                    if (res.statusCode !== 200) {
                      var err = 'project builder unable to save ' + unsignedApkPath +
                        ' to S3. Status Code: ' + res.statusCode;
                      console.log(err);
                      return cb(err);
                    }

                    signer.post('/sign', {
                      apk_id: id,
                      unsigned_apk_s3_path: unsignedApkPath,
                      unsigned_apk_s3_hash: unsignedApkHash,
                      signed_apk_s3_path: signedApkPath
                      
                    }, function(err, rawBody) {
                      s3.deleteApk(unsignedApkPath);
                      if (err) {
                        console.log('Problem with /sign request');
                        console.error(err);
                        return cb(err);
                        
                      } else {
                        try {
                          var body = JSON.parse(rawBody);
                          if (! body.signed_apk_s3_url) {
                            return cb('Unable to sign, ERROR expected s3 url');
                          } else {
                            return cb(null, body.signed_apk_s3_url);
                          }
                        } catch (e) {
                          console.log('Unable to parse ', rawBody);
                          return cb('Unable to parse signer response');
                        }
                      }
                    });
                  });
                });
  });
}

function sha1(text) {
  var sha = crypto.createHash('sha1');
  sha.update(text);
  return sha.digest('hex');
}

function writeFileSync(filename, content) {
  fsUtil.ensureDirectoryExistsFor(filename);
  fs.writeFileSync(filename, content);
}

module.exports = {
  ApkProjectCreator: ApkProject
};
