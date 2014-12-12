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
  });
})();
