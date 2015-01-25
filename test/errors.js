/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  var fvalid = require('../');

  describe('Errors for', function() {
    it('validator function that fails to return', function() {
      var validator = function() {};
      (function() {
        fvalid.validate({}, validator);
      }).should.throw(
        'validator function failed to return true or string'
      );
    });

    it('return of more than one expectation string', function() {
      var validator = function() {
        return ['a', 'b'];
      };
      var expectation = 'validator function failed ' +
        'to return true or string';
      (function() {
        fvalid.validate({}, validator);
      }).should.throw(expectation);
      (function() {
        fvalid.valid({}, validator);
      }).should.throw(expectation);
    });

    it('conjunction of zero validator functions', function() {
      (function() {
        fvalid.all();
      }).should.throw(
        'fvalid.all requires an array or argument list of ' +
        'validator functions'
      );
    });

    it('.validate without a validator function', function() {
      (function() {
        fvalid.validate({}, undefined);
      }).should.throw(
        'fvalid.validate requires a validator function argument'
      );
    });

    it('.ownProperty without a validator function', function() {
      (function() {
        fvalid.ownProperty('name', null);
      }).should.throw(
        'fvalid.ownProperty requires a validator function argument'
      );
    });

    it('.optionalProperty without a validator function', function() {
      (function() {
        fvalid.optionalProperty('name', null);
      }).should.throw(
        'fvalid.optionalProperty requires a validator function argument'
      );
    });

    it('.eachElement without a validator function', function() {
      (function() {
        fvalid.eachElement(null);
      }).should.throw(
        'fvalid.eachElement requires a validator function argument'
      );
    });

    it('.someElement without a validator function', function() {
      (function() {
        fvalid.someElement(null);
      }).should.throw(
        'fvalid.someElement requires a validator function argument'
      );
    });

    it('.onlyProperties without any property names', function() {
      (function() {
        fvalid.onlyProperties([]);
      }).should.throw(
        'fvalid.onlyProperties requires at least one name argument'
      );
    });
  });
})();
