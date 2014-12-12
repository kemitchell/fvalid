/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  describe('Example', function() {
    var fvalid = require('../fvalid');

    describe('simple string matcher', function() {
      var isString = function(x) {
        return typeof x === 'string' ?
          this.pass() :
          this.expected('string');
      };

      it('validates a string', function() {
        fvalid.validate('', isString)
          .should.be.empty;
      });

      it('rejects an object', function() {
        fvalid.validate({}, isString)
          .should.eql([ {
            path: [],
            found: {},
            expected: 'string'
          } ]);
      });
    });

    describe('property matcher', function() {
      var hasNameProperty = fvalid.ownProperty('name', function(x) {
        return x === true ? this.pass() : this.expected('true');
      });

      it('validates a matching object', function() {
        fvalid.validate({ name: true }, hasNameProperty)
          .should.be.empty;
      });

      it('reports missing property', function() {
        var data = { other: true };
        fvalid.validate(data, hasNameProperty)
          .should.eql([ {
            path: [],
            found: data,
            expected: 'own property "name"'
          } ]);
      });

      it('reports property not matching', function() {
        var data = { name: false };
        fvalid.validate(data, hasNameProperty)
          .should.eql([ {
            path: [ 'name' ],
            found: data,
            expected: 'true'
          } ]);
      });
    });

    describe('nested property matcher', function() {
      var validator = fvalid.ownProperty('a',
        fvalid.ownProperty('b', function() {
          return this.pass();
        })
      );

      it('matches an object', function() {
        var o = {
          a: {
            b: true
          }
        };
        fvalid.validate(o, validator)
          .should.be.empty;
      });

      it('rejects an with the wrong nested property', function() {
        var data = {
          a: {
            INVALID: true
          }
        };
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [ 'a' ],
            found: data,
            expected: 'own property "b"'
          } ]);
      });
    });

    describe('"a" and "b" validator', function() {
      var validator = fvalid.and(
        function(x) {
          return x.indexOf('a') > -1 ?
            this.pass() :
            this.expected('string containing "a"');
        },
        function(x) {
          return x.indexOf('b') > -1 ?
            this.pass() :
            this.expected('string containing "b"');
        }
      );

      it('validates "banana"', function() {
        fvalid.valid('banana', validator).should.be.true;
      });

      it('rejects "arm" with one error', function() {
        var data = 'arm';
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: 'string containing "b"'
          } ]);
      });

      it('rejects "gun" with two errors', function() {
        var data = 'gun';
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: 'string containing "a"'
          }, {
            path: [],
            found: data,
            expected: 'string containing "b"'
          } ]);
      });
    });

    var isString = function(x) {
      return typeof x === 'string';
    };

    describe('no contiguous strings', function() {
      var validator = function(x) {
        // There are two contiguous strings in an array if,
        // for some item in the array
        return x.some(function(current, i, list) {
          if (
            // (that is not the first item)
            i > 0 &&
            // the item is a string and
            isString(current) &&
            // the item before it in the array is also a string.
            isString(list[i - 1])
          ) {
            return true;
          } else {
            return false;
          }
        }) ?
          this.expected('array without contiguous strings') :
          this.pass();
      };

      it('rejects [ "a", "b" ]', function() {
        fvalid.valid([ 'a', 'b' ], validator)
          .should.be.false;
      });

      it('accepts [ "a", null, "b" ]', function() {
        fvalid.valid([ 'a', null, 'b' ], validator)
          .should.be.true;
      });
    });
  });
})();
