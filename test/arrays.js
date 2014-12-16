/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  var fvalid = require('../');

  describe('Arrays', function() {
    describe('each element', function() {
      var validator = fvalid.eachElement(function(x) {
        return x > 3 ?
          true : 'number greater than 3';
      });

      it('accepts empty array', function() {
        fvalid.valid([], validator)
          .should.be.true;
      });

      it('accepts valid inputs', function() {
        fvalid.validate([ 4, 5, 6 ], validator)
          .should.be.empty;
      });

      it('requires an array', function() {
        var data = null;
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: [ 'array' ]
          } ]);
        fvalid.valid(data, validator)
          .should.be.false;
      });

      it('rejects invalid inputs', function() {
        var data = [ 3, 4, 5 ];
        fvalid.validate(data, validator)
          .should.be.eql([ {
            path: [ 0 ],
            found: 3,
            expected: [ 'number greater than 3' ]
          } ]);
        fvalid.valid(data, validator)
          .should.be.false;
      });

      it('returns errors for each invalid element', function() {
        fvalid.validate([ 3, 4, 1 ], validator)
          .should.be.eql([ {
            path: [ 0 ],
            found: 3,
            expected: [ 'number greater than 3' ]
          }, {
            path: [ 2 ],
            found: 1,
            expected: [ 'number greater than 3' ]
          } ]);
      });
    });

    describe('some element', function() {
      var validator = fvalid.someElement(function(x) {
        return x > 3 ?
          true : 'number greater than 3';
      });

      it('rejects empty array', function() {
        var data = [];
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: [ 'non-empty array' ]
          } ]);
        fvalid.valid(data, validator)
          .should.be.false;
      });

      it('accepts valid inputs', function() {
        var data = [ 1, 2, 6 ];
        fvalid.validate(data, validator)
          .should.be.empty;
        fvalid.valid(data, validator)
          .should.be.true;
      });

      it('rejects invalid inputs', function() {
        var data = [ 1, 2, 3 ];
        fvalid.validate(data, validator)
          .should.be.eql([ {
            path: [],
            found: data,
            expected: [ 'some number greater than 3' ]
          } ]);
        fvalid.valid(data, validator)
          .should.be.false;
      });
    });
  });
})();
