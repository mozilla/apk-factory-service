/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var crypto = require('crypto');
var url = require('url');

var _ = require('underscore');

var permissionMap = require('./android_permissions');

function packageName (manifestUrl) {
  var dirname = url.resolve(manifestUrl, "."),
      urlObj = url.parse(dirname),
      hostname = urlObj.hostname;

  var sha = crypto.createHash('md5');
  sha.update(manifestUrl);
  var uniq = 'p' + sha.digest('hex') + '.';

  var parts = (uniq + hostname).split(/[.\/]/);
  return _.chain(parts).
            compact().reverse().

            // Replace non-[A-Za-z0-9_] characters with underscores.
            map(function(part) { return part.replace(/\W/g, "_"); }).

            // Ensure first character of part is letter.
            map(function(part) { return part.replace(/^[^A-Za-z]/, "x"); }).

            value().join(".");
}

function permissions (webPermissions) {
  if (!_.isObject(webPermissions)) {
    return [];
  }

  return _.chain(webPermissions).keys().map(
        function(key) {
          var access = webPermissions[key].access;
          return access ? permissionMap[key + ":" + access] : permissionMap[key];
        }).flatten().uniq().value();
}

function versionCode (string) {
  var match, re = /(\d+)/g, androidVersionCode = 0,
      // multipler = 10^(2*(n-1)),
      // where n is the number of dotted digits we care about
      // n = 3
      multiplier = 10000;

  while (true) {
    match = re.exec(string);
    if (!match) {
      // fugliness to keep jshint happy.
      break;
    }
    var v = parseInt(match[1], 10);
    androidVersionCode += v * multiplier;
    multiplier /= 100;
    if (multiplier < 1) {
      break;
    }
  }
  return androidVersionCode;
}

function iconSize (string) {

  var icons = {
    "fallback": "hdpi",
    "16": "ldpi",
    "30": "ldpi", // FxOS size
    "32": "ldpi",
    "48": "mdpi", // android size
    "60": "mdpi", // FxOS size
    "64": "mdpi",
    "72": "hdpi", // android size
    "96": "xhdpi", // android size
    "128": "xhdpi",
    "144": "480dpi", // android size
    "256": "480dpi"
  };

  return icons[string] || icons.fallback;
}

module.exports = {
  versionCode: versionCode,
  permissions: permissions,
  packageName: packageName,
  iconSize: iconSize
};