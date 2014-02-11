/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var hawk = require('hawk');
var request = require('request');

var withConfig = require('../lib/config');


exports.get = function(path, cb) {
  withConfig(function(config) {
    var reqOpt = {
      uri: config.signerUrl + path,
      method: 'GET',
      headers: {}
    };

    var hdr = hawk.client.header(reqOpt.uri,
                                 reqOpt.method,
                                 {credentials: config.hawk,
                                  payload: '',
                                  contentType: 'text/plain'});
    if (hdr.err) {
      console.log('request header error', hdr.err);
      return cb('INTERNAL_REQUEST_ERROR');
    }
    reqOpt.headers.Authorization = hdr.field;

    request(reqOpt, function (error, response, body) {
      if (error) {
        console.log('request error', error);
        return cb('SIGNER_REQUEST_FAILED');
      }

      // Make sure that the signer thinks *our* request is valid.
      if (response.statusCode !== 200) {
        console.log('signer system error response:',
                    response.statusCode, response.body);
        return cb('SIGNER_REFUSED_REQUEST');
      }

      var isValid = hawk.client.authenticate(response,
                                             config.hawk,
                                             hdr.artifacts,
                                             {payload: body,
                                              require: true});

      if (isValid) {
        return cb(null, body);
      } else {
        return cb('INVALID_SIGNER_RESPONSE');
      }
    });
  });
};
