#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var path = require('path');

var jshint = require('jshint').JSHINT;
var tap = require('tap');

var __dirname = '/home/ozten/apk-factory-service/test/';

var libRc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.jshintrc')).toString());
var r;

var cbc = 0;

function checkFileOrDir(filePath, test) {
  console.log(typeof filePath, filePath);
  cbc++;
  fs.readdir(filePath, function(err, files) {
    cbc--;
    if (undefined === files) {
      return
    }
    console.log(files);
    files.forEach(function(file) {
      console.log(typeof filePath, filePath, typeof file, file);
      var childPath = path.join(filePath, file);
      console.log(typeof childPath, childPath);
      cbc++;
      fs.stat(childPath, function(err, stat) {
	cbc--;
        if (err) return;
	if (stat.isFile() &&
            file.lastIndexOf('.js') === file.length - 3) {
	  console.log('XXXXXXXXXXXXX ', file);
	  cbc++;
	  checkFile(childPath, test);
	} else if (stat.isDirectory()) {
	  checkFileOrDir(path.join(childPath, file), test);
	}
      });
    });    
  });
}

function checkFile(childPath, test) {
  fs.readFile(childPath, {
    encoding: 'utf8'
  }, function(err, code) {
    test.notOk(err);
    console.log('jshinting ', childPath);
    cbc--;
    test.ok(jshint(code, libRc), childPath + ': ' + JSON.stringify(jshint.errors));
    if (0 === cbc) {
      test.end();
    }
  });
}

tap.test('Check lib with jshint', function(test) {
  checkFileOrDir(path.join(__dirname, '..', 'lib'), test);
  //TODO checkFileOrDir(path.join(__dirname, '..', 'test'), test);
  checkFileOrDir(path.join(__dirname, '..', 'int-test'), test);
  checkFile(path.join(__dirname, '..', 'bin', 'controller'), test);
  checkFile(path.join(__dirname, '..', 'bin', 'generator'), test);
});