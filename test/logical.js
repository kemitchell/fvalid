/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  var fvalid = require('../');

  describe('Logical Operations', function() {
    var hasAChar = function(x) {
      return x.indexOf('a') > -1 ?
        true : 'string containing "a"';
    };

    var hasBChar = function(x) {
      return x.indexOf('b') > -1 ?
        true : 'string containing "b"';
    };

    var hasCChar = function(x) {
      return x.indexOf('c') > -1 ?
        true : 'string containing "c"';
    };

    describe('"a" and "b" validator', function() {
      var validator = fvalid.all(hasAChar, hasBChar);

      it('validates "banana"', function() {
        fvalid.valid('banana', validator).should.be.true;
      });

      it('rejects "arm" with one error', function() {
        var data = 'arm';
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: [ 'string containing "b"' ]
          } ]);
        fvalid.valid(data, validator)
          .should.be.false;
      });

      it('rejects "gun" with two errors', function() {
        var data = 'gun';
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: [
              'string containing "a"',
              'string containing "b"'
            ]
          } ]);
        fvalid.valid(data, validator)
          .should.be.false;
      });
    });

    describe('"a" or "b" validator', function() {
      var validator = fvalid.any(hasAChar, hasBChar, hasCChar);

      it('accepts "apple"', function() {
        fvalid.valid('apple', validator)
          .should.be.true;
      });

      it('accepts "bird"', function() {
        fvalid.valid('bird', validator)
          .should.be.true;
      });

      it('rejects "dog" with an error', function() {
        var data = 'dog';
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: [ {
              any: [
                'string containing "a"',
                'string containing "b"',
                'string containing "c"'
              ]
            } ]
          } ]);
        fvalid.valid(data, validator)
          .should.be.false;
      });
    });

    describe('complex combination', function() {
      var predicate = function(expect, predicate) {
        return function(x) {
          return predicate(x) ?
            true : expect;
        };
      };

      var is = function(value) {
        return function(x) {
          return x === value;
        };
      };

      var isTypeOf = function(type) {
        return function(x) {
          return typeof x === type ?
            true : type;
        };
      };

      var validator = fvalid.all(
        fvalid.ownProperty('prop', fvalid.all(
          fvalid.any(
            predicate('1', is(1)),
            predicate('true', is(true)),
            fvalid.all(
              isTypeOf('number'),
              function(x) {
                return x > 3 ?
                  true : 'greater than 3';
              }
            )
          )
        ))
      );

      it('produces structured errors', function() {
        var value = null;
        fvalid.validate({ prop: value }, validator)
          .should.eql([ {
            path: [ 'prop' ],
            found: value,
            expected: [ {
              any: [
                '1',
                'true',
                [
                  'number',
                  'greater than 3'
                ]
              ]
            } ]
          } ]);
        fvalid.valid({ prop: value }, validator)
          .should.be.false;
      });
    });
  });
})();
