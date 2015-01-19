// fvalid.js
// =========
// validate nested objects with functions
(function() {
  'use strict';

  var moduleName = 'fvalid';

  var fvalid = function() {
    // The object to be exported
    var exports = {
      name: moduleName,
      version: '0.0.4'
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
    var contextualize = function(path, validator, booleanMode) {
      return function(input) {
        var returned = validator(input, path, booleanMode);

        // `input` is valid input, so return an array of no errors.
        if (returned === true) {
          if (booleanMode) {
            return true;
          } else {
            return [];
          }

        // Invalid input in boolean errors mode
        } else if (booleanMode && returned === false) {
          return false;

        // `input` is not valid input.
        } else if (
          // `returned` is a string description of what was expected.
          typeof returned === 'string' ||

          // `returned` lists one of several alternatives, or a value
          // matching several expectations.
          isObject(returned)
        ) {
          if (booleanMode) {
            return false;
          } else {
            // Create an error object from a string indicating what was
            // expected at this path in the data being validated.
            return [ {
              path: path,
              found: input,
              expected: [ returned ]
            } ];
          }

        // `returned` is a list of errors.
        } else {
          var badResultExpectation = 'validator function failed ' +
            'to return true or string';

          if (Array.isArray(returned)) {
            if (booleanMode) {
              throw new Error(badResultExpectation);
            } else {
              return returned.map(function(error) {
                if (typeof error === 'string') {
                  throw new Error(badResultExpectation);
                } else {
                  return error;
                }
              });
            }

          // The validator returned some other value.
          } else {
            throw new Error(badResultExpectation);
          }
        }
      };
    };

    // TODO: Add asynchronous validator function support.

    // TODO: Consider passing a single context argument to validators.

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
      return contextualize([], validator, false)(value);
    };

    // Boolean form of `.validate`
    exports.valid = function(value, validator) {
      validator = ensureValidatorArgument('validate', validator);
      return contextualize([], validator, true)(value);
    };

    // ### Compose Validator Functions

    // #### Objects

    // Build a validator function that ...
    exports.ownProperty = function(name, validator) {
      validator = ensureValidatorArgument('ownProperty', validator);
      return function(input, path, booleanMode) {
        // ensures the input is an object, ...
        if (!isObject(input)) {
          return booleanMode ?
            false : 'object with property ' + JSON.stringify(name);
        // ensure that object has a given property, and ...
        } else if (!input.hasOwnProperty(name)) {
          return booleanMode ?
            false : 'own property ' + JSON.stringify(name);
        // validates the property per a given validator function.
        } else {
          var propertyPath = path.concat(name);
          return contextualize(
            propertyPath, validator, booleanMode
          )(input[name]);
        }
      };
    };

    // Build a validator function that ...
    exports.optionalProperty = function(name, validator) {
      validator = ensureValidatorArgument(
        'optionalProperty', validator
      );
      return function(input, path, booleanMode) {
        // ensures the input is an object, ...
        if (!isObject(input)) {
          return booleanMode ?
            false : 'object with optional property ' +
              JSON.stringify(name);
        // checks whether that object has a given property, and ...
        } else if (!input.hasOwnProperty(name)) {
          return true;
        // validates that property's value per a given validator
        // function.
        } else {
          var propertyPath = path.concat(name);
          return contextualize(
            propertyPath, validator, booleanMode
          )(input[name]);
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

      return function(input, path, booleanMode) {
        // ensures that the input is an object, and ...
        if (!isObject(input)) {
          if (booleanMode) {
            return false;
          } else {
            var quoted = allowedProperties.map(JSON.stringify);
            return 'object with only the ' +
              plural(allowedProperties, 'property', 'properties') +
              ' ' + conjunctionList('and', quoted);
          }
        } else {
          // rejects any properties of that object other than those
          // permitted.
          var names = Object.keys(input);

          var nameIsAllowed = function(name) {
            return allowedProperties.indexOf(name) > -1;
          };

          if (booleanMode) {
            return names.every(nameIsAllowed);
          } else {
            return names.reduce(function(output, name) {
              if (nameIsAllowed(name)) {
                return output;
              } else {
                var propertyPath = path.concat(name);
                return output.concat(
                  contextualize(
                    propertyPath,
                    function() {
                      return 'no property "' + name + '"';
                    },
                    booleanMode
                  )(input[name])
                );
              }
            }, []);
          }
        }
      };
    };

    // #### Arrays

    // Build a validator function, ...
    exports.eachElement = function(validator) {
      // with a validator function, ...
      validator = ensureValidatorArgument('eachElement', validator);

      return function(input, path, booleanMode) {
        // that ensures the input is an array and ...
        if (!Array.isArray(input)) {
          return booleanMode ?
            false : 'array';
        } else {
          // ensures that each element of that array is valid per the
          // given validator function.
          if (booleanMode) {
            return input.every(function(element, index) {
              return contextualize(
                path.concat(index), validator, booleanMode
              )(element);
            });
          } else {
            return input.reduce(function(errors, element, index) {
              return errors.concat(
                contextualize(
                  path.concat(index),
                  validator,
                  booleanMode
                )(element)
              );
            }, []);
          }
        }
      };
    };

    // Build a validator function ...
    exports.someElement = function(validator) {
      // with a validator function, ...
      validator = ensureValidatorArgument('someElement', validator);

      return function(input, path, booleanMode) {
        // that ensures the input is an array and ...
        if (!Array.isArray(input) || input.length === 0) {
          return booleanMode ?
            false : 'non-empty array';
        } else {
          if (booleanMode) {
            return input.some(function(element, index) {
              return contextualize(
                path.concat(index), validator, booleanMode
              )(element);
            });
          } else {
            var lastErrors = null;
            var match = input.some(function(element, index) {
              var errors = contextualize(
                path.concat(index), validator, booleanMode
              )(element);
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
        }
      };
    };

    // #### Logical Combinators

    // Conjoins an array or arguments list of validator functions into a
    // single validator function.
    exports.all = function() {
      var validators = ensureValidatorArguments('all', arguments);

      return function(input, path, booleanMode) {
        if (booleanMode) {
          return validators.every(function(validator) {
            return contextualize(path, validator, booleanMode)(input);
          });
        } else {
          // Bind all the validator functions to the context where
          // `.all` is invoked.
          var errors = validators.map(function(validator) {
            return contextualize(path, validator, booleanMode);
          })
          // Collect errors from invoking the validator functions.
          .reduce(function(output, validator) {
            return output.concat(validator(input));
          }, []);

          if (errors.length === 0) {
            return [];
          } else {
            return errors.reduce(function(output, error) {
              var errorAtPath = find.call(output, function(existing) {
                return samePath(existing.path, error.path);
              });
              if (errorAtPath === undefined) {
                return output.concat(error);
              } else {
                var allExpected = errorAtPath.expected.concat(
                  error.expected
                );
                errorAtPath.expected = allExpected;
                return output;
              }
            }, []);
          }
        }
      };
    };

    // TODO: Optimize `.and` with one function argument

    // Disjoins an array or arguments list of validator functions into a
    // single validator function.
    exports.any = function() {
      var validators = ensureValidatorArguments('any', arguments);

      return function(input, path, booleanMode) {
        // Enumerate validator functions until we find a match.
        if (booleanMode) {
          return validators.some(function(validator) {
            return !contextualize(
              path, validator, booleanMode
            )(input);
          });
        } else {
          // Used to accumulate all of the errors from all of the
          // validator functions. If none of them match, `.or` will
          // create its own error with `expected` reflecting all of the
          // expectations that might have been matched.
          var allErrors = [];

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
            // Pull the expectations from the errors generated by all
            // the validator functions.
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
