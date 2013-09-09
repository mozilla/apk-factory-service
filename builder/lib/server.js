/**
 * Module dependencies.
 */
var express = require('express'),
    url = require('url'),
    path = require("path"),
    _ = require("underscore"),

    optimist = require("optimist"),



    ApkGenerator = require("./apk-generator").ApkGenerator;

function env (key) {
  var i=0, max=arguments.length, value;
  for ( ; i < max; i++) {
    value = process.env[arguments[i]];
    if (value) {
      return value;
    }
  }
}

var argv = optimist
    .usage('Usage: $0 {OPTIONS}')
    .wrap(80)
    .option('buildDir', {
        alias: "d",
        desc: "Use this directory as the temporary project directory",
        default: env("STACKATO_FILESYSTEM_BUILD", "TMPDIR")
    })
    .option('cacheDir', {
        alias: "c",
        desc: "Use this directory as the directory to cache keys and apks",
        default: env("STACKATO_FILESYSTEM_CACHE", "TMPDIR")
    })
    .option('port', {
        alias: "p",
        desc: "Use the specific port to serve. This will override process.env.PORT.",
        default: env("VCAP_APP_PORT", "PORT") || 8080
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

        if (!argv.buildDir) {
          throw "Must specify a build directory";
        }

        if (!argv.cacheDir) {
          throw "Must specify a cache directory";
        }

        argv.buildDir = path.resolve(process.cwd(), argv.buildDir);
        argv.cacheDir = path.resolve(process.cwd(), argv.cacheDir);

    })
    .argv;


var app = express();

// app.use(express.cookieParser());
// app.use(express.session({
//   secret: 'twegrergq25y345y245y'
// }));

//app.use("/client", express.static('client'));

var appGenerator = function (request, response) {

  var generator = new ApkGenerator(argv.buildDir, argv.cacheDir);

  var manifestUrl = request.query.manifestUrl;

  if (!manifestUrl) {
    response.status(400, "A manifestUrl param is needed");
    return;
  }

  generator.generate(manifestUrl, function (err, apkLoc) {
    if (err) {
      response.status(400, err);
      return;
    }
    response.status(200);
    response.type("application/vnd.android.package-archive");
    response.sendfile(apkLoc);
  });

};


app.get('/application.apk', appGenerator);


var port = argv.port;
var host = process.env.VCAP_APP_HOST || "127.0.0.1";

console.log("running on " + host + ":" + port);

app.listen(port);