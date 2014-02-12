var path = require('path');
var optimist = require('optimist');

module.exports = optimist
  .usage('Usage: $0 {OPTIONS}')
  .wrap(80)
  .option('buildDir', {
    alias: "d",
    desc: "Use this directory as the temporary project directory"
  })
  .option('cacheDir', {
    alias: "c",
    desc: "Use this directory as the directory to cache keys and apks"
  })
  .option('config-files', {
    desc: "Use this list of config files for configuration",
    default: process.env.CONFIG_FILES ||
      path.join(__dirname, '../config/default.js')
  })
  .option('force', {
    alias: "f",
    desc: "Force the projects to be built every time, i.e. don't rely on cached copies"
  })
  .option('controller-port', {
    alias: "p",
    desc: "Use the specific port to serve. This will override process.env.CONTROLLER_SERVER_PORT."
  })
  .option('generator-hostname', {
    alias: "g",
    desc: "Use this hostname for the generator. This will override process.env.GENERATOR_SERVER_HOSTNAME."
  })
  .option('generator-port', {
    desc: "Use the specific port to serve. This will override process.env.GENERATOR_SERVER_PORT."
  })
  .option('aws-access-key-id', {
    desc: "AWS access key id for S3. This will override process.env.AWS_ACCESS_KEY_ID."
  })
  .option('aws-secret-access-key', {
    desc: "AWS secret access key for S3. This will override process.env.AWS_SECRET_ACCESS_KEY."
  })
  .option('help', {
    alias: "?",
    desc: "Display this message",
    boolean: true
  })
  .check(function (argv) {
    if (argv.help) {
      throw "";
    }
  })
  .argv;