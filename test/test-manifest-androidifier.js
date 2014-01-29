var tap = require('tap');

var androidifier = require('../lib/manifest_androidifier');

tap.test("Package names derived from manifest urls", function(test) {
  test.equal(
    androidifier.packageName(
      'http://people.mozilla.org/~fdesre/openwebapps/package.manifest'),
    'org.mozilla.people.p119691cbcfd564653a59d9f27470b6de');

  // Same domain are unique
  test.equal(
    androidifier.packageName(
      'http://people.mozilla.org/~ozten/package.manifest'),
    'org.mozilla.people.pc9156f333f184c5a6a5acf6990d89722');

  test.equal(
    androidifier.packageName(
      'http://deltron3030.testmanifest.com/manifest.webapp'),
    'com.testmanifest.deltron3030.p9e0be02021ec689fade96642d8a5a3fe');

  test.end();
});