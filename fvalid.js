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
    var exports = {
      name: moduleName,
      version: '0.0.0-prerelease'
    };

    var contextualize = function(path, validator) {
      return function(x) {
        var context = {
          path: path,
          pass: function() {
            return [];
          },
          fail: function(expected) {
            return [ { path: path, expected: expected } ];
          }
        };
        return validator.call(context, x);
      };
    };

    exports.validate = function(value, validator) {
      return contextualize([], validator)(value);
    };

    exports.valid = function() {
      // TODO: Fail boolean validation on first error
      var errors = exports.validate.apply(this, arguments);
      return errors.length < 1;
    };

    exports.ownProperty = function(name, validator) {
      return function(x) {
        if (typeof x !== 'object') {
          return this.fail('object');
        } else if (!x.hasOwnProperty(name)) {
          return this.fail('own property ' + JSON.stringify(name));
        } else {
          var propertyPath = this.path.concat(name);
          return contextualize(propertyPath, validator)(x[name]);
        }
      };
    };

    // and([ function, function ... ])
    // and(function, function ...)
    exports.and = function() {
      var validators = Array.prototype.slice.call(arguments, 0)
        .reduce(function(mem, i) {
          return mem.concat(i);
        }, []);
      return function(x) {
        var andThis = this;
        return validators.map(function(v) {
          return contextualize(andThis.path, v);
        })
        .reduce(function(errors, v) {
          return errors.concat(v(x));
        }, []);
      };
    };

    return exports;
  });
})();
