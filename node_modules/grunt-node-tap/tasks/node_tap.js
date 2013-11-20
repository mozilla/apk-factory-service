'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var childProcess = require('child_process').spawn;
var _ = require('lodash');
var TapConsumer = require('tap').createConsumer;
var consts = require('./../lib/consts.js');
var utils = require('./../lib/utils.js');

module.exports = function (grunt) {
	consts = consts();
	var exitCodes = consts.exitCodes();

	grunt.registerMultiTask('node_tap', 'A Grunt task to run node-tap tests and read their output.', function () {
		var self = this;
		var done = this.async();
		var async = grunt.util.async;
		var lf = grunt.util.linefeed;

		var options = this.options();
		grunt.verbose.writeflags(options);
		checkOptions();

		var foundFiles = [];
		setupFiles();

		var result = {
			testsPassed: true,
			fileOutput: ''
		};

		runTests(onTestsComplete);

		function onTestsComplete(err) {
			if (err)
				return grunt.fatal(err, exitCodes.fatal);

			if (options.outputTo === 'file')
				grunt.file.write(options.outputFilePath, result.fileOutput);

			if (!result.testsPassed)
				return grunt.warn("Some tests failed.");

			done();
		}

		function runTests(cb) {
			async.forEachSeries(foundFiles, function (file, eCb) {
				var tapConsumer = new TapConsumer();

				var proc = childProcess('node', [file]);
				proc.stdout.pipe(tapConsumer);
				proc.stderr.pipe(process.stderr);

				if (options.outputType === 'tap')
					proc.stdout.on('data', sendOutput);

				proc.on('close', function () {
					_.forEach(['close', 'data', 'end', 'error'], proc.removeAllListeners);
					eCb();
				});

				tapConsumer.on('end', function () {
					var shortFile = file.replace(process.cwd(), '.');
					_.forEach(['close', 'data', 'end', 'error'], tapConsumer.removeAllListeners);

					var stats = statsToString(shortFile, tapConsumer.results);

					if (~['stats', 'failures'].indexOf(options.outputType))
						sendOutput(stats);

					if (tapConsumer.results.ok) return;
					result.testsPassed = false;

					if (options.outputType === 'failures') {
						var failedTests = _(tapConsumer.results.list).reject('ok').valueOf();
						sendOutput(failuresToString(shortFile, failedTests));
					}
				});
			}, cb);
		}

		function sendOutput(output) {
			return {
				console: grunt.log.writeln,
				file: storeOutputForFile
			}[options.outputTo](output);
		}

		function storeOutputForFile(data) {
			result.fileOutput += data;
		}

		function statsToString(file, result) {
			return util.format("Stats: %s: %d/%d", file, result.passTotal, result.testsTotal)
		}

		function failuresToString(file, failures) {
			var str = util.format("%sFile:%s%sFailures:%s", lf, file, lf, lf);

			_(failures).forEach(function (resultObj) {
				resultObj = _.omit(resultObj, 'id', 'ok');
				_(resultObj).forEach(function (resultValue, resultKey) {
					str += resultKey + ':' + util.inspect(resultValue) + lf;
				});
				str += lf;
			});

			return str;
		}

		function checkOptions() {
			var outputTypes = consts.outputTypes();
			if (!~outputTypes.indexOf(options.outputType)) {
				return grunt.fail.fatal(util.format("Invalid outputType option [%s] passed, valid outputType options " +
					"are: [%s]", options.outputType, outputTypes.join(", ")), exitCodes.fatal);
			}

			var outputDests = consts.outputDestinations();
			if (!~outputDests.indexOf(options.outputTo)) {
				return grunt.fail.fatal(util.format("Invalid outputTo option [%s] passed, valid outputTo options " +
					"are: [%s]", options.outputTo, outputDests.join(", ")), exitCodes.fatal);
			}

			if (options.outputTo === 'file' && !options.outputFilePath) {
				return grunt.fail.fatal("The outputFilePath option must be passed when outputting to a file",
					exitCodes.fatal);
			}
		}

		function setupFiles() {
			foundFiles = _(self.filesSrc)
				.map(utils.unary(grunt.file.expand))
				.flatten()
				.map(utils.unary(path.resolve))
				.filter(utils.unary(grunt.file.exists))
				.valueOf();

			grunt.verbose.writeln("Files to process:", foundFiles);

			if (foundFiles.length === 0)
				return grunt.fail.fatal("None of the files passed exist.", exitCodes.fatal);
		}

	});
};
