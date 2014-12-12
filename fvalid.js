/* globals define, module */
(function() {
  'use strict';

  var moduleName = 'fvalid';

  // Universal Module Definition
  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      define(moduleName, [], factory());
    } else if (typeof exports === 'object') {
      module.exports = factory();
    } else {
      root[moduleName] = factory();
    }
  })(this, function() {
    // The object to be exported
    var exports = {
      name: moduleName,
      version: '0.0.0-prerelease'
    };

    // # Vacubulary Used in Comments
    //
    // A _validator function_ is a plain JavaScript closure that take a
    // value to validate as its sole argument and returns the result of
    // either this.pass() or this.expected(String).
    //
    // A _path_ is an array of String and Number indices identifying
    // a value within a nested Javascript data structure.
    //
    //    [ 'phoneNumbers', 2 ]
    //
    // Is the path for the third item of the array value of the
    // 'phoneNumbers' property of an object being validated.

    // Bind a validator function to a particular context. Provide
    // appropriate this.pass and this.expected functions that are aware
    // of the path of the value being validated.
    var contextualize = function(path, validator) {
      return function(x) {
        var context = {
          // Store the path so that validators that descend to object
          // properties or array items can appropriately set the context
          // path of other validators they invoke.
          path: path,

          // Used by the validator function to indicate validity.
          pass: function() {
            return [];
          },

          // Used by the validator function to indicate what was
          // expected, but not found.
          expected: function(expected) {
            // Error messages indicate:
            return [ {
              // 1. where in the data the problem was found,
              path: path,
              // 2. what was expected to be there, and ...
              expected: expected
            } ];
          }
        };

        var errors = validator.call(context, x);

        if (!Array.isArray(errors)) {
          throw new Error(
            'validator function failed to return ' +
            'this.pass() or this.expected()'
          );
        }
        return errors.map(function(error) {
          // 3. what was found instead.
          error.found = x;
          return error;
        });
      };
    };

    // Validate data `value` per validator function `validator`,
    // returning an array of errors, if any.
    exports.validate = function(value, validator) {
      if (typeof validator !== 'function') {
        throw new Error(
          moduleName + '.validate: second argument must be ' +
          'a validator function'
        );
      }
      return contextualize([], validator)(value);
    };

    // Boolean form of `.validate`
    exports.valid = function() {
      // No errors means valid.
      return exports.validate.apply(this, arguments).length === 0;
    };
    // TODO: Return `false` from `.valid` immediately on first error

    // Build a validator function that:
    // 1. ensures an object has a given property, and
    // 2. validates the property per a given validator function.
    exports.ownProperty = function(name, validator) {
      return function(x) {
        if (typeof x !== 'object') {
          return this.expected('object');
        } else if (!x.hasOwnProperty(name)) {
          return this.expected('own property ' + JSON.stringify(name));
        } else {
          var propertyPath = this.path.concat(name);
          return contextualize(propertyPath, validator)(x[name]);
        }
      };
    };

    // Conjoins an array or arguments list of validator functions into a
    // single validator function.
    exports.and = function() {
      // Flatten ([ function, ... ]) and (function, ...)
      var validators = Array.prototype.slice.call(arguments, 0)
        .reduce(function(mem, i) {
          return mem.concat(i);
        }, []);

      if (validators.length < 1) {
        throw new Error(
          moduleName + '.and requires an array or argument list ' +
          'of validator functions'
        );
      }

      return function(x) {
        var thisOfAnd = this;
        return validators.map(function(v) {
          return contextualize(thisOfAnd.path, v);
        })
        .reduce(function(errors, v) {
          return errors.concat(v(x));
        }, []);
      };
    };

    // TODO: Optimize .and with one function argument

    return exports;
  });
})();
