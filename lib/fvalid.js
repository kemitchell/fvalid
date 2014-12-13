/* globals define, module */
(function() {
  'use strict';

  var moduleName = 'fvalid';
  // Functional validation for arbitrarily nested JavaScript data

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
      version: '0.0.0-prerelease-2'
    };

    // # Vocubulary Used in Comments
    //
    // A _validator function_ is a plain JavaScript closure that take a
    // value to validate as its sole argument and returns the result of
    // either true or a string.
    //
    // A _path_ is an array of String and Number indices identifying
    // a value within a nested JavaScript data structure.
    //
    //    [ 'phoneNumbers', 2 ]
    //
    // Is the path for the third item of the array value of the
    // 'phoneNumbers' property of an object being validated.

    var contextualize = function(path, validator) {
      return function(x) {
        var result = validator(x, path);

        if (
          result !== true &&
          typeof result !== 'string' &&
          !Array.isArray(result)
        ) {
          throw new Error(
            'validator function failed to return true or string'
          );
        }

        if (typeof result === 'string') {
          result = [ {
            path: path,
            found: x,
            expected: result
          } ];
        } else if (result === true) {
          result = [];
        }

        return result;
      };
    };

    var ensureValidatorArg = function(functionName, arg) {
      if (typeof arg !== 'function') {
        throw new Error(
          moduleName + '.' + functionName + ' requires ' +
          'a validator function argument'
        );
      } else {
        return arg;
      }
    };

    var ensureValidatorArgs = function(functionName, args) {
      // Flatten ([ function, ... ]) and (function, ...)
      var validators = Array.prototype.slice.call(args, 0)
        .reduce(function(mem, i) {
          return mem.concat(i);
        }, []);
      if (validators.length < 1) {
        throw new Error(
          moduleName + '.' + functionName + ' requires ' +
          'an array or argument list of validator functions'
        );
      } else {
        return validators;
      }
    };

    // TODO: Add asynchronous validator function support.

    // Validate data `value` per validator function `validator`,
    // returning an array of errors, if any.
    exports.validate = function(value, validator) {
      validator = ensureValidatorArg('validate', validator);
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
      validator = ensureValidatorArg('ownProperty', validator);
      return function(x, path) {
        if (typeof x !== 'object') {
          return 'object';
        } else if (!x.hasOwnProperty(name)) {
          return 'own property ' + JSON.stringify(name);
        } else {
          var propertyPath = path.concat(name);
          return contextualize(propertyPath, validator)(x[name]);
        }
      };
    };

    // Build a validator function that validates the value of a property
    // if the object has one.
    exports.optionalProperty = function(name, validator) {
      validator = ensureValidatorArg('optionalProperty', validator);
      return function(x, path) {
        if (typeof x !== 'object') {
          return 'object';
        } else if (!x.hasOwnProperty(name)) {
          return true;
        } else {
          var propertyPath = path.concat(name);
          return contextualize(propertyPath, validator)(x[name]);
        }
      };
    };

    // Build a validator function that rejects any object properties not
    // provided in a given whitelist. (That validator will _not_ ensure
    // that the whitelisted properties exist.)
    exports.onlyProperties = function() {
      var onlyNames = Array.prototype.slice.call(arguments, 0)
        .reduce(function(mem, i) {
          return mem.concat(i);
        }, []);

      if (onlyNames.length === 0) {
        throw new Error(
          moduleName + '.onlyProperties requires ' +
          'at least one name argument'
        );
      }

      return function(x, path) {
        var names = Object.getOwnPropertyNames(x);
        return names.reduce(function(mem, name) {
          var allowed = onlyNames.indexOf(name) > -1;
          if (allowed) {
            return mem;
          } else {
            var propertyPath = path.concat(name);
            return mem.concat(
              contextualize(propertyPath, function() {
                return 'no property "' + name + '"';
              })(x[name])
            );
          }
        }, []);
      };
    };

    // Build a validator function that requires a given validator to
    // validate each item of an array.
    exports.eachItem = function(validator) {
      validator = ensureValidatorArg('eachItem', validator);

      return function(x, path) {
        if (!Array.isArray(x)) {
          return 'array';
        } else {
          return x.reduce(function(mem, item, index) {
            // Collect errors from application to each array item.
            return mem.concat(
              // Invoke the validator in the context of each array item.
              contextualize(path.concat(index), validator)(item)
            );
          }, []);
        }
      };
    };

    // Build a validator function that requires a given validator to
    // validate some item of an array.
    exports.someItem = function(validator) {
      validator = ensureValidatorArg('someItem', validator);

      return function(x, path) {
        if (!Array.isArray(x) || x.length === 0) {
          return 'non-empty array';
        } else {
          var lastErrors = null;
          var match = x.some(function(item, index) {
            // Invoke the validator in the context of each array item.
            var errors = contextualize(
              path.concat(index), validator
            )(item);
            if (errors.length === 0) {
              return true;
            } else {
              lastErrors = errors;
              return false;
            }
          });
          if (match) {
            return true;
          } else {
            return 'some ' + lastErrors[0].expected;
          }
        }
      };
    };

    // Conjoins an array or arguments list of validator functions into a
    // single validator function.
    exports.all = function() {
      var validators = ensureValidatorArgs('all', arguments);

      return function(x, path) {
        // Bind all the validator functions to the context where `.and`
        // is invoked.
        return validators.map(function(v) {
          return contextualize(path, v);
        })
        // Collect errors from invoking the validator functions.
        .reduce(function(errors, v) {
          return errors.concat(v(x));
        }, []);
      };
    };

    // TODO: Optimize `.and` with one function argument

    // Helper method similar to underscore.pick
    var returnProperty = function(name) {
      return function(o) {
        return o[name];
      };
    };

    // Creates "A, C, and|or|then C" lists from arrays
    var conjunctionList = (function() {
      var COMMA = ', ';

      return function(conjunction, array) {
        conjunction = conjunction + ' ';
        var length = array.length;
        if (length === 0) {
          throw new Error('cannot create a list of no elements');
        } else if (length === 1) {
          return array;
        } else if (length === 2) {
          return array[0] + conjunction + array[1];
        } else {
          var head = array.slice(0, array.length - 1).join(COMMA);
          return head + COMMA + conjunction + array[array.length - 1];
        }
      };
    })();

    // Disjoins an array or arguments list of validator functions into a
    // single validator function.
    exports.any = function() {
      var validators = ensureValidatorArgs('any', arguments);

      return function(x, path) {
        // Used to accumulate all of the errors from all of the
        // validator functions. If none of them match, `.or` will create
        // its own error with `expected` reflecting all of the
        // expectations that might have been matched.
        var allErrors = [];

        // Enumerate validator functions until we find a match.
        var valid = validators.some(function(v) {
          var errors = contextualize(path, v)(x);

          // Valid input. Break out of `.some`, since there is no need
          // to collect errors from other validation functions if we
          // have at least one match.
          if (errors.length === 0) {
            return true;
          // Not valid input per this validation function.
          } else {
            // Accumulate errors so we can summarize them later if we
            // don't find a match.
            allErrors = allErrors.concat(errors);
            return false;
          }
        });

        // One of the validation functions matched.
        if (valid) {
          return true;
        // No validation function matched.
        } else {
          // Pull the expectations from the errors generated by all the
          // validator functions.
          var expectations = allErrors.map(returnProperty('expected'));

          // Join those expectation messages into one.
          return conjunctionList('or', expectations);
        }
      };
    };

    return exports;
  });
})();
