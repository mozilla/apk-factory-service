'use strict';

module.exports = function (grunt) {
	grunt.initConfig({
		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js',
				'lib/*.js',
				'test/**/*.js'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		node_tap: {
			failures_console: {
				options: {
					outputType: 'failures', // tap, failures, stats
					outputTo: 'console' // or file
					//outputFilePath: '/tmp/out.log' // path for output file, only makes sense with outputTo 'file'
				},
				files: {
					'tests': ['./test/data/mixed.js']
				}
			},
			stats_console: {
				options: {
					outputType: 'stats',
					outputTo: 'console'
				},
				files: {
					'tests': ['./test/data/mixed.js']
				}
			},
			tap_stream_console: {
				options: {
					outputType: 'tap',
					outputTo: 'console'
				},
				files: {
					'tests': ['./test/data/mixed.js']
				}
			},
			tap_stream_file: {
				options: {
					outputType: 'tap',
					outputTo: 'file',
					outputFilePath: '/tmp/out.log'
				},
				files: {
					'tests': ['./test/data/mixed.js']
				}
			},
			test: {
				options: {
					outputType: 'tap', // tap, failures, stats
					outputTo: 'console' // or file
					//outputFilePath: '/tmp/out.log' // path for output file, only makes sense with outputTo 'file'
				},
				files: {
					'tests': ['./test/data/*.js']
				}
			}
		}
	});

	grunt.loadTasks('tasks');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('default', ['jshint', 'node_tap:test']);

	grunt.registerTask('fc', ['node_tap:failures_console']);
	grunt.registerTask('sc', ['node_tap:stats_console']);
	grunt.registerTask('tc', ['node_tap:tap_stream_console']);
	grunt.registerTask('tf', ['node_tap:tap_stream_file']);

};
