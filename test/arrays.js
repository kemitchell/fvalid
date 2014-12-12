/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  describe('Arrays', function() {
    var fvalid = require('../fvalid');

    describe('each item', function() {
      var validator = fvalid.eachItem(function(x) {
        return x > 3 ?
          this.pass() :
          this.expected('number greater than 3');
      });

      it('accepts empty array', function() {
        fvalid.valid([], validator)
          .should.be.true;
      });

      it('accepts valid inputs', function() {
        fvalid.valid([ 4, 5, 6 ], validator)
          .should.be.true;
      });

      it('rejects invalid inputs', function() {
        fvalid.validate([ 3, 4, 5 ], validator)
          .should.be.eql([ {
            path: [ 0 ],
            found: 3,
            expected: 'number greater than 3'
          } ]);
      });

      it('returns errors for each  invalid item', function() {
        fvalid.validate([ 3, 4, 1 ], validator)
          .should.be.eql([ {
            path: [ 0 ],
            found: 3,
            expected: 'number greater than 3'
          }, {
            path: [ 2 ],
            found: 1,
            expected: 'number greater than 3'
          } ]);
      });
    });

    describe('some item', function() {
      var validator = fvalid.someItem(function(x) {
        return x > 3 ?
          this.pass() :
          this.expected('number greater than 3');
      });

      it('accepts empty array', function() {
        var data = [];
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: 'non-empty array'
          } ]);
      });

      it('accepts valid inputs', function() {
        fvalid.valid([ 1, 2, 6 ], validator)
          .should.be.true;
      });

      it('rejects invalid inputs', function() {
        var data = [ 1, 2, 3 ];
        fvalid.validate(data, validator)
          .should.be.eql([ {
            path: [],
            found: data,
            expected: 'some number greater than 3'
          } ]);
      });
    });
  });
})();
