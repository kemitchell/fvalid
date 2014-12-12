/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  describe('Example', function() {
    var fvalid = require('../fvalid');

    describe('simple string matcher', function() {
      var isString = function(x) {
        return typeof x === 'string' ?
          this.pass() : this.fail('string');
      };

      it('validates a string', function() {
        fvalid.validate('', isString)
          .should.be.empty;
      });

      it('rejects an object', function() {
        fvalid.validate({}, isString)
          .should.eql([ {
            path: [],
            expected: 'string'
          } ]);
      });
    });

    describe('property matcher', function() {
      var hasNameProperty = fvalid.ownProperty('name', function(x) {
        return x === true ? this.pass() : this.fail('true');
      });

      it('validates a matching object', function() {
        fvalid.validate({ name: true }, hasNameProperty)
          .should.be.empty;
      });

      it('reports missing property', function() {
        fvalid.validate({ other: true }, hasNameProperty)
          .should.eql([
            {
              path: [],
              expected: 'own property "name"'
            }
          ]);
      });

      it('reports property not matching', function() {
        fvalid.validate({ name: false }, hasNameProperty)
          .should.eql([ {
              path: [ 'name' ],
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
        var o = {
          a: {
            INVALID: true
          }
        };
        fvalid.validate(o, validator)
          .should.eql([ {
            path: [ 'a' ],
            expected: 'own property "b"'
          } ]);
      });
    });

    describe('"a" and "b" validator', function() {
      var validator = fvalid.and(
        function(x) {
          return x.indexOf('a') > -1 ?
            this.pass() :
            this.fail('string containing "a"');
        },
        function(x) {
          return x.indexOf('b') > -1 ?
            this.pass() :
            this.fail('string containing "b"');
        }
      );

      it('validates "banana"', function() {
        fvalid.valid('banana', validator).should.be.true;
      });

      it('rejects "arm" with one error', function() {
        fvalid.validate('arm', validator)
          .should.eql([
            {
              path: [],
              expected: 'string containing "b"'
            }
          ]);
      });

      it('rejects "gun" with two errors', function() {
        fvalid.validate('gun', validator)
          .should.eql([
            {
              path: [],
              expected: 'string containing "a"'
            }, {
              path: [],
              expected: 'string containing "b"'
            }
          ]);
      });
    });
  });
})();
