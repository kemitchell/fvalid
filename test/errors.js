/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  var fvalid = require('../lib/fvalid');

  describe('Errors for', function() {
    it('validator function that fails to return', function() {
      var validator = function() {};
      (function() {
        fvalid.validate({}, validator);
      }).should.throw(
        'validator function failed to return ' +
        'this.ok or this.expected()'
      );
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

    it('.eachItem without a validator function', function() {
      (function() {
        fvalid.eachItem(null);
      }).should.throw(
        'fvalid.eachItem requires a validator function argument'
      );
    });

    it('.someItem without a validator function', function() {
      (function() {
        fvalid.someItem(null);
      }).should.throw(
        'fvalid.someItem requires a validator function argument'
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
