var _ = require('lodash');

module.exports = function(options) {

  var cache
    , lru
    , lruId = 0
    , gcHandle
    ;

  options = _.extend({
    gcInterval: 30000, // How often GC happens
    maxLength: 1000 // Maximum number of items that can be held in the LRU cache by default.
  }, options);

  function clear() {
    cache = {};
    lru = [];
  }

  function hasOwn (object, key) {
    return object.hasOwnProperty(key);
  }

  function del(key) {
    var item = cache[key];
    if (item) {

      delete lru[item.lru];
      delete cache[key];
    }
  }

  function garbageCollection() {
    Object.keys(cache).forEach(function(key) {
      var item = cache[key];
      if (item.expire <= Date.now()) {
        del(key);
      }
    });
    lruClean();
  }

  function lruClean() {
    var overage = Object.keys(cache).length - options.maxLength
      , cacheId
      , lruKeys = Object.keys(lru)
      ;

    for (var i = 0; i < overage; i++) {
      cacheId = lru.shift();
      delete cache[cacheId];
    }
  }

  clear();
  gcHandle = setInterval(garbageCollection, options.gcInterval);

  return {
    set: function(key, value, ttl) {

      if (typeof key === 'undefined') {
        throw new Error('Invalid key undefined');
      }
      var item =  { value: value, lru: lruId };
      if (ttl) {
        item.expire = Date.now() + ttl;
      }
      cache[key] = item;
      lru[lruId] = key;
      lruId++;
      if (lruId % 100 === 0) {
        lruClean();
      }
    },
    get: function(key) {
      var response
        , item = cache[key];

      if ((item) && ((!item.expire) || (item.expire) && (item.expire >= Date.now()))) {
        response = item.value;
      }
      return response;
    },
    del: del,
    clear: clear,
    size: function() {
      garbageCollection();
      return Object.keys(cache).length;
    },
    dump: function() {
      return cache;
    },
    close: function() {
      clearInterval(gcHandle);
    }
  };
};