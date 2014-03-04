function time(fn) {

  var start = Date.now();
  fn();
  return Date.now() - start;

}

var tests = {}
  , large = 10000
  , types =
  [
    { name: 'Large count and large max length'
    , count: large
    , maxLength: large
    }
  , { name: 'Large count with 25% max length'
    , count: large
    , maxLength: Math.round(large * 0.25)
    }
  , { name: 'Large count with 50% max length'
    , count: large
    , maxLength: Math.round(large * 0.25)
    }
  , { name: 'Large count with 75% max length'
    , count: large
    , maxLength: Math.round(large * 0.75)
    }
  ];

for (var type in types) {
  var values = types[type];
  tests['ttl-lru-cache ' + values.name] = require('./engine.bench')(values.count, function() {
    return require('../lib/cache')({ maxLength: values.maxLength, gcInterval: 10000 });
  });
  tests['lru-cache ' + values.name] = require('./engine.bench')(values.count, function() {
    var LRU = require('lru-cache')
      , cache = LRU(values.maxLength);
    return cache;
  });
}

for (var key in tests) {
  console.log(key);
  for (var subKey in tests[key]) {
    if (subKey === 'end') {
      tests[key][subKey]();
    } else {
      console.log(subKey, time(tests[key][subKey]));
    }
  }
}