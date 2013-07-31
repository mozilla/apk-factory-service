
var filename = "./sample.manifest",
    manifestUrl = "http://wfwalker.github.io/opensun/online.webapp",
    path = require("path"),
    fs = require("fs"),
    manifest = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), filename)));

var _ = require("underscore"),
    nunjucks = require("nunjucks"),
    androidify = require("./manifest-androidifier");

var env = new nunjucks.Environment([new nunjucks.FileSystemLoader('templates')]),
    template = env.getTemplate('AndroidManifest.xml');

var androidData = {
  version: manifest.version,
  versionCode: androidify.versionCode(manifest.version),
  manifestUrl: manifestUrl,
  permissions: androidify.permissions(manifest.permissions),
  packageName: androidify.packageName(manifestUrl)
};

console.log(template.render(androidData));
