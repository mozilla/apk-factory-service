var createCache = require('..')
  , should = require('should')
  ;

describe('ttl-lru-cache', function() {

  describe('#get()', function() {
    it('should return undefined for a key that has not been set', function() {
      var memory = createCache();
      should.equal(memory.get('test'), undefined);
    });
    it('should return value for a key that has been set', function() {
      var memory = createCache();
      memory.set('test', 'hello');
      should.equal(memory.get('test'), 'hello');
    });
    it('should not return a value for a key that has been cleared', function() {
      var memory = createCache();
      memory.set('test', 'hello');
      should.equal(memory.get('test'), 'hello');
      memory.clear('test');
      should.equal(memory.get('test'), undefined);
    });
    it('should return a value when within the TTL', function() {
      var memory = createCache();
      memory.set('test', 'hello', 200);
      should.equal(memory.get('test'), 'hello');
    });
    it('should not return when TTL has been exceeded', function(done) {
      var memory = createCache();
      memory.set('test', 'hello', 10);
      setTimeout(function() {
        should.equal(memory.get('test'), undefined);
        done();
      }, 15);
    });
  });

  describe('#set()', function() {

    it('should allow arrays', function() {
      var memory = createCache();

      memory.set('a', [1,2,3]);
      Array.isArray(memory.get('a')).should.equal(true);
      memory.get('a').should.eql([1,2,3]);
    });

    it('should allow objects', function() {
      var memory = createCache();

      memory.set('a', { a:1 });
      memory.get('a').should.eql({ a:1 });
    });


    it('should allow objects with circular references', function() {
      var memory = createCache()
        , a = { a: 1 }
        , b = { ref: a }
        ;

      a.ref = b;
      memory.set('a', a);
      memory.get('a').ref.should.eql(b);
    });

    it('should not allow undefined key', function() {
      var memory = createCache();
      (function() {
        memory.set(undefined, '');
      }).should.throw('Invalid key undefined');
    });

    it('should remove least recently used from the cache first', function() {

      var memory = createCache({ maxLength: 3 });

      memory.set('a', 'a');
      memory.size().should.eql(1);
      memory.set('b', 'b');
      memory.size().should.eql(2);
      memory.set('c', 'c');
      memory.size().should.eql(3);
      memory.set('d', 'd');
      memory.size().should.eql(3);
    });

    it('should not increase the length when overwriting a value', function() {

      var memory = createCache();

      memory.set('a', 'a');
      memory.size().should.eql(1);
      memory.set('b', 'b');
      memory.size().should.eql(2);
      memory.set('b', 'b');
      memory.size().should.eql(2);
    });


  });

  describe('#del()', function() {
    it('should not error if key does not exist', function() {
      var memory = createCache();
      memory.del('');
    });
    it('should reduce size of cache', function() {
      var memory = createCache();
      memory.set('a', 1);
      memory.size().should.eql(1);
      memory.del('a');
      memory.size().should.eql(0);
    });
  });

  describe('#size', function() {
    it('should return 0 before anything has been added to the cache', function() {
      var memory = createCache();
      memory.size().should.eql(0);
    });

    it('should return 1 after something has been added to the cache', function() {
      var memory = createCache();
      memory.set('test', 'hello');
      memory.size().should.eql(1);
    });

    it('should return 0 after something added has expired', function(done) {
      var memory = createCache();
      memory.set('test', 'hello', 1);
      memory.size().should.eql(1);
      setTimeout(function() {
        memory.size().should.eql(0);
        done();
      }, 2);
    });

    it('should not exceed cache length', function() {

      var memory = createCache({ maxLength: 3 });

      memory.set('a', 'a');
      memory.size().should.eql(1);
      memory.set('b', 'b');
      memory.size().should.eql(2);
      memory.set('c', 'c');
      memory.size().should.eql(3);
      memory.set('d', 'd');
      memory.size().should.eql(3);
    });

  });

});