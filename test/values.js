/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  describe('Values', function() {
    var fvalid = require('../lib/fvalid');

    describe('simple string matcher', function() {
      var isString = function(x) {
        return typeof x === 'string' ? true : 'string';
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
            expected: [ 'string' ]
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
        }) ? 'array without contiguous strings' : true;
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
