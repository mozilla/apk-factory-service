# grunt-node-tap
[![Build Status](https://travis-ci.org/maxnachlinger/grunt-node-tap.png?branch=master)](https://travis-ci.org/maxnachlinger/grunt-node-tap)
> Grunt task to run node-tap tests and read their output.

## Getting Started
This plugin requires Grunt `~0.4.1` 
```shell
npm install grunt-node-tap --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript: 
```js
grunt.loadNpmTasks('grunt-node-tap');
```

### Usage Examples
```js
grunt.initConfig({
    node_tap: {
      default_options: {
          options: {
              outputType: 'failures', // tap, failures, stats
              outputTo: 'console' // or file
              //outputFilePath: '/tmp/out.log' // path for output file, only makes sense with outputTo 'file'
          },
          files: {
              'tests': ['./test/data/*.js']
          }
      }
    }
})
```

### Options

#### options.outputType
Specifies the type of output, `'failures'`, `'stats'`, or `'tap'` (default is `'failures'`), 
the screenshots below might help.


#### options.outputType: stats
![stats outputMode](https://raw.github.com/maxnachlinger/grunt-node-tap/master/doc/stats.png)

#### options.outputType: failures
![failures outputMode](https://raw.github.com/maxnachlinger/grunt-node-tap/master/doc/failures.png)

#### options.outputType: tap
![tap outputMode](https://raw.github.com/maxnachlinger/grunt-node-tap/master/doc/tap.png)

#### options.outputTo
Where to write output, the `'console'` or a `'file'`. Defaults to `'console'`. 

#### options.outputFilePath
Path to output file, this defaults to `null` and only makes sense if `outputTo` is set to `'file'`

#### Fun note:
I imagine an outputType of `'tap'` with an outputTo of `'file'` might make this work with CI software.
