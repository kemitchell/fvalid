/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  describe('Logical Operations', function() {
    var fvalid = require('../lib/fvalid');

    var hasAChar = function(x) {
      return x.indexOf('a') > -1 ? true : 'string containing "a"';
    };

    var hasBChar = function(x) {
      return x.indexOf('b') > -1 ? true : 'string containing "b"';
    };

    var hasCChar = function(x) {
      return x.indexOf('c') > -1 ? true : 'string containing "c"';
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
              'any of': [
                'string containing "a"',
                'string containing "b"',
                'string containing "c"'
              ]
            } ]
          } ]);
      });
    });
  });
})();
