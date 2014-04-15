/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var hawk = require('hawk');
var request = require('request');
var qs = require('querystring');

var logError = require('./log_error');
var metrics = require('./metrics');
var withConfig = require('../lib/config').withConfig;

var log;


exports.get = function(path, cb) {
  withConfig(function(config) {
    var start = new Date();
    metrics.apkSigningRequest(path);
    if (undefined === log) {
      log = require('../lib/logging')(config);
    }
    var reqOpt = {
      uri: config.signerUrl + path,
      method: 'GET',
      headers: {}
    };

    var hdr = hawk.client.header(reqOpt.uri,
      reqOpt.method, {
        credentials: config.hawk,
        payload: '',
        contentType: ''
      });
    if (hdr.err) {
      metrics.apkSigningFailed(path);
      logError(log, 'apk signer request header error ', hdr.err);
      return cb(new Error('INTERNAL_REQUEST_ERROR'));
    }
    reqOpt.headers.Authorization = hdr.field;

    request(reqOpt, function(error, response, body) {
      if (error) {
        metrics.apkSigningFailed(path);
        logError(log, 'apk signer request error ', error);
        return cb(new Error('SIGNER_REQUEST_FAILED'));
      }

      // Make sure that the signer thinks *our* request is valid.
      if (response.statusCode !== 200) {
        metrics.apkSigningFailed(path);
        log.error('signer system error response: ' +
          response.statusCode + ' ' + response.body);
        return cb(new Error('SIGNER_REFUSED_REQUEST'));
      }

      var isValid = hawk.client.authenticate(response,
        config.hawk,
        hdr.artifacts, {
          payload: body,
          require: true
        });

      if (isValid) {
        metrics.apkSigningFinished(path, new Date() - start);
        return cb(null, body);
      } else {
        metrics.apkSigningFailed(path);
        return cb(new Error('INVALID_SIGNER_RESPONSE'));
      }
    });
  });
};

exports.post = function(path, data, cb) {
  var start = new Date();
  metrics.apkSigningRequest(path);
  var body = qs.stringify(data);
  var apkPath = data.unsigned_apk_s3_path;
  withConfig(function(config) {
    if (undefined === log) {
      log = require('../lib/logging')(config);
    }
    var reqOpt = {
      uri: config.signerUrl + path,
      method: 'POST',
      body: body,
      headers: {
        'Content-Length': Buffer.byteLength(body),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    var hdr = hawk.client.header(reqOpt.uri,
      reqOpt.method, {
        credentials: config.hawk,
        payload: body,
        contentType: 'application/x-www-form-urlencoded'
      });
    if (hdr.err) {
      metrics.apkSigningFailed(apkPath);
      logError(log, 'request header error', hdr.err);
      return cb(new Error('INTERNAL_REQUEST_ERROR'));
    }
    reqOpt.headers.Authorization = hdr.field;

    request(reqOpt, function(error, response, body) {
      if (error) {
        metrics.apkSigningFailed(apkPath);
        logError(log, 'request error', error);
        return cb(new Error('SIGNER_REQUEST_FAILED'));
      }

      // Make sure that the signer thinks *our* request is valid.
      if (response.statusCode !== 200) {
        metrics.apkSigningFailed(apkPath);
        log.error('signer system error response: ' +
          response.statusCode + ' ' + response.body);
        return cb(new Error('SIGNER_REFUSED_REQUEST'));
      }

      var isValid = hawk.client.authenticate(response,
        config.hawk,
        hdr.artifacts, {
          payload: body,
          require: true
        });

      if (isValid) {
        metrics.apkSigningFinished(apkPath, new Date() - start);
        return cb(null, body);
      } else {
        metrics.apkSigningFailed(apkPath);
        return cb(new Error('INVALID_SIGNER_RESPONSE'));
      }
    });
  });
};
