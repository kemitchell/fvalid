// fvalid.js
// =========
// Functional validation for arbitrarily nested JavaScript data
(function() {
  'use strict';

  var moduleName = 'fvalid';

  var fvalid = function() {
    // The object to be exported
    var exports = {
      name: moduleName,
      version: '0.0.2'
    };

    // Vocabulary Used in Comments
    // ---------------------------
    //
    // A _validator function_ is a plain JavaScript closure that take a
    // value to validate as its sole argument and returns either `true`
    // or a string.
    //
    // A _path_ is an array of string and number indices identifying a
    // value within a nested JavaScript data structure. `[ 'addresses',
    // 2 ]` is the path for the third item of the array value of the
    // 'addresses' property of an object being validated.

    // Utility Functions
    // -----------------

    // Is the given input a non-array object?
    var isObject = (function() {
      var toString = Object.prototype.toString;
      return function(input) {
        return toString.call(input) === '[object Object]' &&
          Boolean(input) &&
          !Array.isArray(input);
      };
    })();

    // Wrap a validator function in logic that ensures errors that it
    // reports its reports are scoped to the correct path in the object
    // being validated. This is the crux of `fvalid`.
    var contextualize = function(path, validator) {
      return function(input) {
        var returned = validator(input, path);

        // Create an error object from a string indicating what was
        // expected at this path in the data being validated.
        var errorWithExpectation = function(expected) {
          return {
            path: path,
            found: input,
            expected: [ expected ]
          };
        };

        // `input` is valid input, so return an array of no errors.
        if (returned === true) {
          return [];

        // `input` is not valid input.
        } else if (
          // `returned` is a string description of what was expected.
          typeof returned === 'string' ||
          // `returned` lists one of several alternatives, or a value
          // matching several expectations.
          isObject(returned)
        ) {
          return [ errorWithExpectation(returned) ];

        // `returned` is a list of errors.
        } else if (Array.isArray(returned)) {
          return returned.map(function(error) {
            if (typeof error === 'string') {
              throw new Error(
                'validator returned more than one expectation'
              );
            } else {
              return error;
            }
          });

        // The validator returned some other value.
        } else {
          throw new Error(
            'validator function failed to return true or string'
          );
        }
      };
    };

    // TODO: Add asynchronous validator function support.

    // ### Error Generation Helpers

    // Returns the plural or singular form of a noun, depending on the
    // number of elements in an array.
    var plural = function(array, singular, plural) {
      var length = array.length;
      /* istanbul ignore if */
      if (length === 0) {
        throw new Error('array has no elements');
      } else if (length === 1) {
        return singular;
      } else {
        return plural;
      }
    };

    // Creates "A, C, < and | or | ... > C" lists from arrays
    var conjunctionList = (function() {
      var COMMA = ',';

      return function(conjunction, array) {
        conjunction = ' ' + conjunction + ' ';
        var length = array.length;
        /* istanbul ignore if */
        if (length === 0) {
          throw new Error('cannot create a list of no elements');
        } else if (length === 1) {
          return array;
        } else if (length === 2) {
          return array[0] + conjunction + array[1];
        } else {
          var head = array.slice(0, array.length - 1).join(COMMA + ' ');
          return head + COMMA + conjunction + array[array.length - 1];
        }
      };
    })();

    // ### Argument Type Checking

    // Ensure that an argument to a function is, as far as the runtime
    // can tell, a valid validator function.
    var ensureValidatorArgument = function(functionName, argument) {
      if (typeof argument !== 'function') {
        throw new Error(
          moduleName + '.' + functionName + ' requires ' +
          'a validator function argument'
        );
      } else {
        return argument;
      }
    };

    // Ensure that all of the arguments to a function are, as far as the
    // runtime can tell, either valid validator functions or arrays of
    // valid validator functions.
    var ensureValidatorArguments = function(functionName, args) {
      var validators = Array.prototype.slice.call(args, 0)
        .reduce(function(output, i) {
          return output.concat(i);
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

    // ### Miscellaneous Helper Functions

    // A function akin to Underscore's `_.pick`.
    var returnProperty = function(name) {
      return function(o) {
        return o[name];
      };
    };

    // Return the first element of an array matching a given predicate.
    var find = function(predicate) {
      var array = Object(this);
      var length = this.length;
      for (var index = 0; index < length; index++) {
        var value = array[index];
        if (predicate(value, index, array)) {
          return value;
        }
      }
      return undefined;
    };

    // TODO: Use ECMA-262 6th edition `Array.prototype.find`.

    // Determine if two paths are the same by performing a shallow
    // comparison of numbers and strings.
    var samePath = function(firstPath, secondPath) {
      if (firstPath.length !== secondPath.length) {
        return false;
      }
      return !firstPath.some(function(element, index) {
        return element !== secondPath[index];
      });
    };

    // API
    // ---

    // ### Use Validator Functions

    // Validate data `value` per validator function `validator`,
    // returning an array of errors, if any.
    exports.validate = function(value, validator) {
      validator = ensureValidatorArgument('validate', validator);
      return contextualize([], validator)(value);
    };

    // Boolean form of `.validate`
    exports.valid = function() {
      // No errors means valid.
      return exports.validate.apply(this, arguments).length === 0;
    };

    // TODO: Return `false` from `.valid` immediately on first error

    // ### Compose Validator Functions

    // #### Objects

    // Build a validator function that ...
    exports.ownProperty = function(name, validator) {
      validator = ensureValidatorArgument('ownProperty', validator);
      return function(input, path) {
        // ensures the input is an object, ...
        if (!isObject(input)) {
          return 'object with property ' + JSON.stringify(name);
        // ensure that object has a given property, and ...
        } else if (!input.hasOwnProperty(name)) {
          return 'own property ' + JSON.stringify(name);
        // validates thje property per a given validator function.
        } else {
          var propertyPath = path.concat(name);
          return contextualize(propertyPath, validator)(input[name]);
        }
      };
    };

    // Build a validator function that ...
    exports.optionalProperty = function(name, validator) {
      validator = ensureValidatorArgument(
        'optionalProperty', validator
      );
      return function(input, path) {
        // ensures the input is an object, ...
        if (!isObject(input)) {
          return 'object with property ' + JSON.stringify(name);
        // checks whether that object has a given property, and ...
        } else if (!input.hasOwnProperty(name)) {
          return true;
        // validates that property's value per a given validator
        // function.
        } else {
          var propertyPath = path.concat(name);
          return contextualize(propertyPath, validator)(input[name]);
        }
      };
    };

    // Build a validator function that ...
    exports.onlyProperties = function() {
      // takes a white list of permitted object properties, ...
      var allowedProperties = Array.prototype.slice.call(arguments, 0)
        .reduce(function(output, argument) {
          return output.concat(argument);
        }, []);

      if (allowedProperties.length === 0) {
        throw new Error(
          moduleName + '.onlyProperties requires ' +
          'at least one name argument'
        );
      }

      return function(input, path) {
        // ensures that the input is an object, and ...
        if (!isObject(input)) {
          var quoted = allowedProperties.map(JSON.stringify);
          return 'object with only the ' +
            plural(allowedProperties, 'property', 'properties') + ' ' +
            conjunctionList('and', quoted);
        } else {
          var names = Object.keys(input);
          // rejects any properties of that object other than those
          // permitted.
          return names.reduce(function(output, name) {
            var allowed = allowedProperties.indexOf(name) > -1;
            if (allowed) {
              return output;
            } else {
              var propertyPath = path.concat(name);
              return output.concat(
                contextualize(propertyPath, function() {
                  return 'no property "' + name + '"';
                })(input[name])
              );
            }
          }, []);
        }
      };
    };

    // #### Arrays

    // Build a validator function, ...
    exports.eachElement = function(validator) {
      // with a validator function, ...
      validator = ensureValidatorArgument('eachElement', validator);

      return function(input, path) {
        // that ensures the input is an array and ...
        if (!Array.isArray(input)) {
          return 'array';
        } else {
          // ensures that each element of that array is valid per the
          // given validator function.
          return input.reduce(function(output, item, index) {
            return output.concat(
              contextualize(path.concat(index), validator)(item)
            );
          }, []);
        }
      };
    };

    // Build a validator function ...
    exports.someItem = function(validator) {
      // with a validator function, ...
      validator = ensureValidatorArgument('someItem', validator);

      return function(input, path) {
        // that ensures the input is an array and ...
        if (!Array.isArray(input) || input.length === 0) {
          return 'non-empty array';
        } else {
          var lastErrors = null;
          var match = input.some(function(item, index) {
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

    // #### Logical Combinators

    // Conjoins an array or arguments list of validator functions into a
    // single validator function.
    exports.all = function() {
      var validators = ensureValidatorArguments('all', arguments);

      return function(input, path) {
        // Bind all the validator functions to the context where `.and`
        // is invoked.
        var errors = validators.map(function(validator) {
          return contextualize(path, validator);
        })
        // Collect errors from invoking the validator functions.
        .reduce(function(output, validator) {
          return output.concat(validator(input));
        }, []);

        if (errors.length === 0) {
          return [];
        } else {
          return errors.reduce(function(output, error) {
            var errorAtSamePath = find.call(output, function(existing) {
              return samePath(existing.path, error.path);
            });
            if (errorAtSamePath === undefined) {
              return output.concat(error);
            } else {
              var allExpected = errorAtSamePath.expected.concat(
                error.expected
              );
              errorAtSamePath.expected = allExpected;
              return output;
            }
          }, []);
        }
      };
    };

    // TODO: Optimize `.and` with one function argument

    // Disjoins an array or arguments list of validator functions into a
    // single validator function.
    exports.any = function() {
      var validators = ensureValidatorArguments('any', arguments);

      return function(input, path) {
        // Used to accumulate all of the errors from all of the
        // validator functions. If none of them match, `.or` will create
        // its own error with `expected` reflecting all of the
        // expectations that might have been matched.
        var allErrors = [];

        // Enumerate validator functions until we find a match.
        var valid = validators.some(function(validator) {
          var errors = contextualize(path, validator)(input);

          // Valid input. Break out of `.some`, since there is no need
          // to collect errors from other validator functions if we
          // have at least one match.
          if (errors.length === 0) {
            return true;

          // Not valid input per this validator function.
          } else {
            // Accumulate errors so we can summarize them later if we
            // don't find a match.
            allErrors = allErrors.concat(errors);
            return false;
          }
        });

        // One of the validator functions matched.
        if (valid) {
          return true;

        // No validation function matched.
        } else {
          // Pull the expectations from the errors generated by all the
          // validator functions.
          var expectations = allErrors
            .map(returnProperty('expected'))
            .reduce(function(output, expectation) {
              // A single expectation
              if (expectation.length === 1) {
                return output.concat(expectation);

              // A conjunction
              } else {
                return output.concat([ expectation ]);
              }
            });

          // Join those expectation messages into one.
          return { any: expectations };
        }
      };
    };

    return exports;
  };

  // Universal Module Definition
  // ---------------------------

  // Export for AMD, Node.js, or if all else fails, to a browser global.

  /* globals define, module */
  /* istanbul ignore next */
  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      define(moduleName, [], factory());
    } else if (typeof exports === 'object') {
      module.exports = factory();
    } else {
      root[moduleName] = factory();
    }
  })(this, fvalid);
})();
