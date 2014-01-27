var fs = require('fs');
var path = require('path');

var tap = require('tap');

var fileLoader = require('../lib/file_loader');

tap.test('We can strip BOM characters', function(test) {
  var manifestFile = path.join(__dirname, 'data', 'pacman-canvas.webapp');
  var loader = fileLoader.create(manifestFile);

  loader.load(manifestFile, function(err, data) {
    test.equal(fileLoader.stripBom(data)[0], '{');

    var text = new Buffer(data, 'utf8').toString('utf8');
    test.equal(fileLoader.stripBom(text).charAt(0), '{');

    fs.readFile(manifestFile, function(err, data) {
      var text = new Buffer(data, 'utf8').toString('utf8');
      test.equal(fileLoader.stripBom(text).charAt(0), '{');
      test.end();
    });
  });
});