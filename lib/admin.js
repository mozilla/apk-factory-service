/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var db = require('./db');
var sha1 = require('./sha1');

module.exports = function(req, res, config) {
  console.log('req.body=', req.body);
  var body = req.body;
  if ('clear-cached-apk' === body.command &&
      !! body.manifestUrl) {
    console.log('Clearing ', body.manifestUrl);
    db.clearApk(sha1(body.manifestUrl), config, sendDBResponse(res));    
  } else if ('clear-all-apks' === body.command ) {
    db.clearAllApks(config, sendDBResponse(res));
  } else {
    throw new Error('Unknown command');
  }
};

function sendDBResponse(res) {
  return function(err, rowsAffected) {
    res.send(err || 'OK ' + rowsAffected + ' rows deleted');
  };
}