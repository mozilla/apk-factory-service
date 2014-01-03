var Step = require('step');

/**
 *
 */
module.exports = function(apks, cb) {
  var manifests = Object.keys(apks);
  var outdated = [];
  Step(

    function checkForUpdate() {
      var group = this.group();
      manifests.forEach(function(manifest) {
        var version = apks[manifest];
        outdated.push(manifest);
        group()();
      });
    },

    function sendResp(err) {
      cb(err, outdated);
    }
  );
};