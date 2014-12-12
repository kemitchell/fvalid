/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  var fvalid = require('../fvalid');

  describe('Errors for', function() {
    it('validator function that fails to return', function() {
      var validator = function() {};
      (function() {
        fvalid.validate({}, validator);
      }).should.throw(
        'validator function failed to return ' +
        'this.pass() or this.expected()'
      );
    });

    it('conjunction of zero validator functions', function() {
      (function() {
        fvalid.and()
      }).should.throw(
        'fvalid.and requires an array or argument list of ' +
        'validator functions'
      );
    });

    it('.validate without a validator function', function() {
      (function() {
        fvalid.validate({}, undefined);
      }).should.throw(
        'fvalid.validate: second argument must be a validator function'
      );
    });
  });
})();
