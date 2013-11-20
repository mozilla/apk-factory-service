var fs = require('fs');
var path = require('path');
var vm = require('vm');

var context = vm.createContext();

module.exports = function(configFiles) {
    var configPaths = configFiles.split(',');

    configPaths.forEach(function(configPath) {
	var configFile = path.join(process.cwd(), configPath);
	console.log(configFile);
        console.log(vm.runInContext(fs.readFileSync(configFile), context, configFile));

        console.log('context=', context);
    });

};