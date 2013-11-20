module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: ".jshintrc"
      },

      all: ["lib/**/*.js", "test/**/*.js", "!*.min.js", "Gruntfile.js"]
    },

    node_tap: {
      short_tests: {
          options: {
              outputType: 'stats', // tap, failures, stats
              outputTo: 'console' // or file
              //outputFilePath: '/tmp/out.log' // path for output file, only makes sense with outputTo 'file'
          },
          files: {
              'tests': ['./test/test-*.js']
          }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-node-tap');


  grunt.registerTask("default", ["jshint", "node_tap"]);
};