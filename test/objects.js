/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  describe('Objects', function() {
    var fvalid = require('../fvalid');

    describe('property matching', function() {
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
            found: data.name,
            expected: 'true'
          } ]);
      });

      describe('of nested properties', function() {
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
    });
  });
})();
