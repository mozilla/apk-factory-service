/**
 * Module dependencies.
 */
var express = require('express'),
    url = require('url'),
    path = require("path"),

    optimist = require("optimist"),

    apikey = require('./apikey-real'),

    ApkGenerator = require("./apk-generator").ApkGenerator;

var argv = optimist
    .usage('Usage: $0 {OPTIONS}')
    .wrap(80)
    .option('tmpDir', {
        alias: "d",
        desc: "Use this directory as the temporary project directory",
        default: path.resolve(process.env.TMPDIR, "apps")
    })
    .option('port', {
        alias: "p",
        desc: "Use the specific port to serve. This will override process.env.PORT.",
        default: 8080
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

        if (!argv.tmpDir) {
          throw "Must specify a manifest location";
        }

    })
    .argv;

var tmpDirNumber = 0;

var app = express();

// app.use(express.cookieParser());
// app.use(express.session({
//   secret: 'twegrergq25y345y245y'
// }));

//app.use("/client", express.static('client'));

var appGenerator = function (request, response) {

  var generator = new ApkGenerator(path.resolve(process.cwd(), argv.tmpDir));

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

app.get('/apk', appGenerator);
app.get('/application.apk', appGenerator);


var port = argv.port || process.env.PORT || 8080;
var host = process.env.VCAP_APP_HOST || "127.0.0.1";

console.log("running on " + host + ":" + port);

app.listen(port);