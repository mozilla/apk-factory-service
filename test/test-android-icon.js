var fs = require('fs');
var path = require('path');

var fsExtra = require('fs.extra');
var tap = require('tap');

var icon = require('../lib/android_icon');

process.env['FILESYSTEM_BUILD'] = '/tmp/test';
process.env['CONFIG_FILES'] = path.join(__dirname, 'data', 'default_config.js');

const data = [
  ['factory_104302940_9f02a7a37f.bmp', 'factory_104302940_9f02a7a37f_bmp.png'],
  ['factory_104302940_9f02a7a37f.tga', 'factory_104302940_9f02a7a37f_tga.png'],
  ['factory_3014809426_e4bc4102d8.png', 'factory_3014809426_e4bc4102d8_png.png'],
  ['factory_645568786_bc726d9b08.jpg', 'factory_645568786_bc726d9b08_jpg.png'],
  ['factory_104302940_9f02a7a37f.gif', 'factory_104302940_9f02a7a37f_gif.png'],
  ['factory_104302940_9f02a7a37f.tif', 'factory_104302940_9f02a7a37f_tif.png'],
  ['factory_3515972671_3f084cbaff.jpg', 'factory_3515972671_3f084cbaff_jpg.png'],
  ['factory_USA.svg', 'factory_USA.png'],
  ['factory_104302940_9f02a7a37f.jpg', 'factory_104302940_9f02a7a37f_jpg.png'],
  ['factory_3014809426_e4bc4102d8.jpg', 'factory_3014809426_e4bc4102d8_jpg.png'],
  ['factory_3515972671_3f084cbaff.png', 'factory_3515972671_3f084cbaff_png.png'],
  ['factory_bad_file.png', null]
];

tap.test("Given OWA Icons, we can produce Android compatible Icons", function(test) {
  var pathPrefix = path.join(__dirname, 'data', 'android-icon', 'reference');
  var goldenPrefix = path.join(__dirname, 'data', 'android-icon', 'golden');
  var tmp =  path.join(__dirname, 'data', 'android-icon', 'tmp');
  try {
    fs.mkdirSync(tmp);
  } catch (e) {}
  var i=0;
  var end = function(x) {
    return function () {
                    setTimeout(function() {
		      console.log('Going here', x);
  		      if (0 === x) {
                        fsExtra.rmrf(tmp, function() {
			  test.end();
			});
		      }
		    }, 100);
    };
  }
  data.forEach(function(datum) {
    i++;
    var inputFile = path.join(pathPrefix, datum[0]);
    var tmpFile = path.join(tmp, 'icon' + datum[0] + Math.random());
    icon.optimize(inputFile,
		  64, 64,
		  tmpFile,
		  function(err, filename) {
		    i--;
                    if (null === datum[1]) {
		      test.ok(!!err, 'We expected some kind of err' + err);
                      end(i)();
		    } else {
                      testFileEquals(test, filename, path.join(goldenPrefix, datum[1]), function() {
  		        end(i)();
		      });
		    }
// TODO test that the icon matches the golden image
		  });
  });
});

function testFileEquals(test, fileA, fileB, cb) {
  fs.readFile(fileA, function(err, fileAData) {
    if (err) {
      //TODO test.fail work?
      test.ok(false, err);
      return cb(err);
    }
    fs.readFile(fileB, function(err, fileBData) {
      if (err) {
        test.ok(false, err);
        return cb(err);
      }
      console.log('Comparing', fileA, fileB);
      test.equal(fileAData.toString('utf8'),
                 fileBData.toString('utf8'),
                 "Image file contents should match");
      cb();
    });
  });
}