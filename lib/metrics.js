/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Various metrics for system monitoring
 */

exports.serverStarted = function() {

};

var requests = 0;
exports.generateApkRequest = function(manifestUrl) {
  requests++;
};

exports.badManifestUrl = function() {

};

var finished = 0;
exports.generationApkFinished = function(timeEllapsed) {
  finished++;
};

exports.generationApkFailed = function() {

};

var previousRequests = 0;
var previousCompleted = 0;

setInterval(function() {
  var newRequests = requests - previousRequests;
  previousRequests = requests;
  var completed = finished - previousCompleted;
  previousCompleted = finished;

  console.log(newRequests, 'new requests,', completed, 'requests completed. TOT Req:', requests, 'TOT Finished:', finished, 'TOT inflight:', requests - finished);
}, 1000);