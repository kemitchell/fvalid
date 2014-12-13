/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  describe('Objects', function() {
    var fvalid = require('../lib/fvalid');

    describe('property matching', function() {
      var hasNameProperty = fvalid.ownProperty('name', function(x) {
        return x === true ? true : 'true';
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
            found: data.name,
            expected: 'true'
          } ]);
      });

      describe('of nested properties', function() {
        var validator = fvalid.ownProperty('a',
          fvalid.ownProperty('b', function() {
            return true;
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

        it('rejects object with the wrong nested property', function() {
          var data = {
            a: {
              INVALID: true
            }
          };
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [ 'a' ],
              found: data.a,
              expected: 'own property "b"'
            } ]);
        });
      });

      describe('of optional properties', function() {
        var validator = fvalid.optionalProperty('a', function(x) {
          return x === true ? true : 'true';
        });

        it('matches an object without the property', function() {
          var data = {};
          fvalid.validate(data, validator)
            .should.be.empty;
        });

        it('rejects object with a bad value', function() {
          var data = {
            a: 'INVALID'
          };
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [ 'a' ],
              found: data.a,
              expected: 'true'
            } ]);
        });
      });

      describe('only properties', function() {
        var validator = fvalid.onlyProperties('a');

        it('accepts valid inputs', function() {
          fvalid.valid({ a: 1 }, validator)
            .should.be.true;
        });

        it('does not check that properties exist', function() {
          fvalid.valid({}, validator)
            .should.be.true;
        });

        it('rejects additional properties', function() {
          var data = {
            a: 1,
            b: 2,
            c: 3
          };
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [ 'b' ],
              found: data.b,
              expected: 'no property "b"'
            }, {
              path: [ 'c' ],
              found: data.c,
              expected: 'no property "c"'
            } ]);
        });
      });
    });
  });
})();
