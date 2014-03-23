var path = require('path');
var spawn = require('child_process').spawn;

var controller = path.join(__dirname, '..', 'bin', 'controller');
var generator = path.join(__dirname, '..', 'bin', 'generator');

var children = [];

['JAVA_HOME', 'ANDROID_HOME'].forEach(function(v) {
  if (!process.env[v]) {
    console.log("WARNING: You should set the environment variable " + v);
  }
});

if (!process.env['CONFIG_FILES']) {
  var c = [
    path.join(__dirname, '..', 'config', 'default.js'),
    path.join(__dirname, '..', 'config', 'developer.js')
  ];
  console.log(process.env['INT_TESTING']);
  if (process.env['INT_TESTING']) {
    c.push(path.join(__dirname, '..', 'config', 'integration.js'));
  }
  process.env['CONFIG_FILES'] = c.join(',');
  console.log(process.env['CONFIG_FILES']);
}

function wireUp(child, prefix) {
  children.push(child);
  child.stdout.on('data', function(data) {
    console.log(prefix, data.toString('utf8'));
  });

  child.stderr.on('data', function(data) {
    console.log('ERROR ' + prefix, data.toString('utf8'));
  });

  child.on('close', function(code) {
    children.forEach(function(aChild) {
      aChild.kill('SIGHUP');
    });
  });
}

var cChild = spawn('node', [controller]);
wireUp(cChild, 'CONTROLLER:');

var gChild = spawn('node', [generator]);
wireUp(gChild, 'GENERATOR:');
