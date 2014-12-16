/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  var fvalid = require('../');

  describe('Objects', function() {
    describe('property matching', function() {
      var validator = fvalid.ownProperty('name', function(x) {
        return x === true ?
          true : 'true';
      });


      it('rejects non-object values', function() {
        var data = null;
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: [ 'object with property "name"' ]
          } ]);
        fvalid.valid(data, validator)
          .should.be.false;
      });

      it('validates a matching object', function() {
        fvalid.validate({ name: true }, validator)
          .should.be.empty;
      });

      it('reports object expected', function() {
        var data = null;
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: [ 'object with property "name"' ]
          } ]);
      });

      it('reports missing property', function() {
        var data = { other: true };
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [],
            found: data,
            expected: [ 'own property "name"' ]
          } ]);
      });

      it('reports property not matching', function() {
        var data = { name: false };
        fvalid.validate(data, validator)
          .should.eql([ {
            path: [ 'name' ],
            found: data.name,
            expected: [ 'true' ]
          } ]);
      });

      describe('of nested properties', function() {
        var validator = fvalid.ownProperty('alpha',
          fvalid.ownProperty('beta', function() {
            return true;
          })
       );

        it('matches an object', function() {
          var o = {
            alpha: {
              beta: true
            }
          };
          fvalid.validate(o, validator)
            .should.be.empty;
        });

        it('rejects object with the wrong nested property', function() {
          var data = {
            alpha: {
              INVALID: true
            }
          };
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [ 'alpha' ],
              found: data.alpha,
              expected: [ 'own property "beta"' ]
            } ]);
          fvalid.valid(data, validator)
            .should.be.false;
        });
      });

      describe('of optional properties', function() {
        var validator = fvalid.optionalProperty('alpha', function(x) {
          return x === true ?
            true : 'true';
        });

        it('rejects a non-object value', function() {
          var data = null;
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [],
              found: data,
              expected: [ 'object with property "alpha"' ]
            } ]);
          fvalid.valid(data, validator)
            .should.be.false;
        });

        it('matches an object without the property', function() {
          var data = {};
          fvalid.validate(data, validator)
            .should.be.empty;
        });

        it('reports object expected', function() {
          var data = null;
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [],
              found: data,
              expected: [ 'object with property "alpha"' ]
            } ]);
        });

        it('rejects object with a bad value', function() {
          var data = {
            alpha: 'INVALID'
          };
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [ 'alpha' ],
              found: data.alpha,
              expected: [ 'true' ]
            } ]);
          fvalid.valid(data, validator)
            .should.be.false;
        });
      });

      describe('only properties', function() {
        var validator = fvalid.onlyProperties('alpha');

        it('accepts valid inputs', function() {
          fvalid.valid({ alpha: 1 }, validator)
            .should.be.true;
        });

        it('rejects null', function() {
          var data = null;
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [],
              found: data,
              expected: [ 'object with only the property "alpha"' ]
            } ]);
          fvalid.valid(data, validator)
            .should.be.false;
        });

        it('rejects a string', function() {
          var data = 'string';
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [],
              found: data,
              expected: [ 'object with only the property "alpha"' ]
            } ]);
          fvalid.valid(data, validator)
            .should.be.false;
        });

        it('uses correct plurals in error message', function() {
          fvalid.validate(
            null,
            fvalid.onlyProperties('alpha', 'beta')
          )
            .should.eql([ {
              path: [],
              found: null,
              expected: [
                'object with only the properties "alpha" and "beta"'
              ]
            } ]);
          fvalid.validate(
            null,
            fvalid.onlyProperties('alpha', 'beta', 'kappa')
          )
            .should.eql([ {
              path: [],
              found: null,
              expected: [
                'object with only the properties ' +
                '"alpha", "beta", and "kappa"'
              ]
            } ]);
        });

        it('does not check that properties exist', function() {
          fvalid.valid({}, validator)
            .should.be.true;
        });

        it('rejects additional properties', function() {
          var data = {
            alpha: 1,
            beta: 2,
            kappa: 3
          };
          fvalid.validate(data, validator)
            .should.eql([ {
              path: [ 'beta' ],
              found: data.beta,
              expected: [ 'no property "beta"' ]
            }, {
              path: [ 'kappa' ],
              found: data.kappa,
              expected: [ 'no property "kappa"' ]
            } ]);
        });
      });
    });
  });
})();
