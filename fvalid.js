/* globals define, module */
(function() {
  'use strict';

  // Functional validation for arbitrarily nested JavaScript data
  var fvalid = function() {
    // The object to be exported
    var exports = {
      name: moduleName,
      version: '0.0.0-prerelease-2'
    };

    // # Vocabulary Used in Comments
    //
    // A _validator function_ is a plain JavaScript closure that take a
    // value to validate as its sole argument and returns the result of
    // either true or a string.
    //
    // A _path_ is an array of String and Number indices identifying
    // a value within a nested JavaScript data structure.
    //
    //    [ 'addresses', 2 ]
    //
    // Is the path for the third item of the array value of the
    // 'addresses' property of an object being validated.

    var isObject = function(input) {
      return Object.prototype.toString(input) === '[object Object]' &&
        Boolean(input) &&
        !Array.isArray(input);
    };

    var contextualize = function(path, validator) {
      return function(input) {
        var result = validator(input, path);

        var wrapExpected = function(expected) {
          return {
            path: path,
            found: input,
            expected: [ expected ]
          };
        };

        // `input` is valid input, so return an array of no errors.
        if (result === true) {
          return [];

        // `input` is not valid input.
        } else if (
          // `result` is a string description of what was expected.
          typeof result === 'string' ||
          // `result` lists one of several alternatives, or a value
          // matching several expectations.
          isObject(result)
        ) {
          return [ wrapExpected(result) ];

        // `result` is a list of errors.
        } else if (Array.isArray(result)) {
          return result.map(function(error) {
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
      return function(input, path) {
        if (!isObject(input)) {
          return 'object with property ' + JSON.stringify(name);
        } else if (!input.hasOwnProperty(name)) {
          return 'own property ' + JSON.stringify(name);
        } else {
          var propertyPath = path.concat(name);
          return contextualize(propertyPath, validator)(input[name]);
        }
      };
    };

    // Build a validator function that validates the value of a property
    // if the object has one.
    exports.optionalProperty = function(name, validator) {
      validator = ensureValidatorArg('optionalProperty', validator);
      return function(input, path) {
        if (!isObject(input)) {
          return 'object with property ' + JSON.stringify(name);
        } else if (!input.hasOwnProperty(name)) {
          return true;
        } else {
          var propertyPath = path.concat(name);
          return contextualize(propertyPath, validator)(input[name]);
        }
      };
    };

    var plural = function(list, singular, plural) {
      return list.length === 1 ?
        singular : plural;
    };

    // Creates "A, C, and|or|then C" lists from arrays
    var conjunctionList = (function() {
      var COMMA = ',';

      return function(conjunction, array) {
        conjunction = ' ' + conjunction + ' ';
        var length = array.length;
        // istanbul ignore if
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

    // Build a validator function that rejects any object properties not
    // provided in a given white list. (That validator will _not_ ensure
    // that the white-listed properties exist.)
    exports.onlyProperties = function() {
      var onlyNames = Array.prototype.slice.call(arguments, 0)
        .reduce(function(output, i) {
          return output.concat(i);
        }, []);

      if (onlyNames.length === 0) {
        throw new Error(
          moduleName + '.onlyProperties requires ' +
          'at least one name argument'
        );
      }

      return function(input, path) {
        if (!isObject(input)) {
          return 'object with only the ' +
            plural(onlyNames, 'property', 'properties') + ' ' +
            conjunctionList('and', onlyNames.map(JSON.stringify));
        } else {
          var names = Object.keys(input);
          return names.reduce(function(output, name) {
            var allowed = onlyNames.indexOf(name) > -1;
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

    // Build a validator function that requires a given validator to
    // validate each item of an array.
    exports.eachItem = function(validator) {
      validator = ensureValidatorArg('eachItem', validator);

      return function(input, path) {
        if (!Array.isArray(input)) {
          return 'array';
        } else {
          return input.reduce(function(output, item, index) {
            // Collect errors from application to each array item.
            return output.concat(
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

      return function(input, path) {
        if (!Array.isArray(input) || input.length === 0) {
          return 'non-empty array';
        } else {
          var lastErrors = null;
          var match = input.some(function(item, index) {
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

    // Return the first element of an array matching a given predicate.
    var find = function(predicate) {
      var array = Object(this);
      for (var i = 0; i < this.length; i++) {
        var value = array[i];
        if (predicate(value, i, array)) {
          return value;
        }
      }
      return undefined;
    };

    // Are two paths the same?
    var samePath = function(a, b) {
      // Perform a shallow comparison of two arrays that can contain
      // numbers and strings.
      if (a.length !== b.length) {
        return false;
      }
      return !a.some(function(elem, index) {
        return elem !== b[index];
      });
    };

    // Conjoins an array or arguments list of validator functions into a
    // single validator function.
    exports.all = function() {
      var validators = ensureValidatorArgs('all', arguments);

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

    // Helper method similar to underscore.pick
    var returnProperty = function(name) {
      return function(o) {
        return o[name];
      };
    };

    // Disjoins an array or arguments list of validator functions into a
    // single validator function.
    exports.any = function() {
      var validators = ensureValidatorArgs('any', arguments);

      return function(input, path) {
        // Used to accumulate all of the errors from all of the
        // validator functions. If none of them match, `.or` will create
        // its own error with `expected` reflecting all of the
        // expectations that might have been matched.
        var allErrors = [];

        // Enumerate validator functions until we find a match.
        var valid = validators.some(function(v) {
          var errors = contextualize(path, v)(input);

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

  var moduleName = 'fvalid';

  // Universal Module Definition
  // istanbul ignore next
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
