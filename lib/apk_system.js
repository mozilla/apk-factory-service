/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var apkSigner = require('./apk_signer_client');


// Web views that can be used to monitor the
// health of the APK generator system


exports.authz = function(req, res) {
  // Let's you test if your client's Hawk authorization is set up to talk
  // to the APK generator.
  res.send({msg: 'authorization successful'});
};


exports.signer = function(req, res) {
  // Let's you test if the APK generator can talk to the APK signer with
  // Hawk authorization.

  apkSigner.get('/system/auth', function(err, content) {
    if (err) {
      res.send({success: false, msg: err}, 409);
    } else {
      console.log('successful signer connection:', content);
      res.send({success: true,
                msg: 'ESTABLISHED_CONNECTION'}, 203);
    }
  });
};
