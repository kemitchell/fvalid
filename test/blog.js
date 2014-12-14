/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  // Long-form examples of validations for a cartoon microblog
  describe('Blog Example', function() {
    var fvalid = require('../fvalid');

    var validators = {};

    (function() {
      // Bind to underscore for easy reading.
      var _ = fvalid;

      var isObject = function(x) {
        return (
          x &&
          !Array.isArray(x) &&
          Object.prototype.toString.call(x) === '[object Object]'
        ) ?
          true : 'object';
      };

      var ofType = function(type) {
        return function(x) {
          return typeof x === type ?
            true : type;
        };
      };

      var isString = ofType('string');

      var nonEmptyString = function(x) {
        return typeof x === 'string' && x.length === 0 ?
          'non-empty string' : true;
      };

      var nonEmptyArray = function(x) {
        return Array.isArray(x) && x.length === 0 ?
          'non-empty array' : true;
      };

      var maxLength = function(len) {
        return function(x) {
          return x.length <= len ?
            true : 'string of ' + len + ' characters or less';
        };
      };

      var matchesRegEx = function(re) {
        return function(x) {
          return re.test(x) ?
            true : 'string matching ' + re.toString();
        };
      };

      var validDateString = function(string) {
        var match = /^(\d\d\d\d)-(\d\d)-(\d\d)$/.exec(string);
        var args = match.slice(1, 4).map(Number);
        var date = new Date(args);
        return isNaN(date.getTime()) ?
          'valid date' : true;
      };

      var allUpperCase = function(string) {
        return string.toUpperCase() === string ?
          true : 'upper-case string';
      };

      validators.post = _.all(
        isObject,

        _.ownProperty('author', nonEmptyString),

        _.ownProperty('date', _.all(
          isString,
          matchesRegEx(/^\d\d\d\d-\d\d-\d\d$/),
          validDateString
        )),

        _.ownProperty('tags', _.all(
          nonEmptyArray,
          _.eachItem(_.all(
            nonEmptyString,
            _.any(
              matchesRegEx(/^@[A-Z]+$/),
              allUpperCase
            )
          ))
        )),

        _.ownProperty('text', _.all(
          nonEmptyString,
          maxLength(140)
        ))
      );
    })();

    describe('post', function() {
      it('matches a valid example', function() {
        var data = {
          author: 'John',
          date: '2015-01-01',
          tags: [ 'TESTING', '@JOAN' ],
          text: [ 'This is a valid post' ]
        };
        fvalid.validate(data, validators.post)
          .should.be.empty;
      });

      it('rejects an invalid example', function() {
        var data = {
          author: '',
          date: '2015-01-32',
          text: 'This is a valid post'
        };
        fvalid.validate(data, validators.post)
          .should.eql([
            {
              path: [ 'author' ],
              found: '',
              expected: [ 'non-empty string' ]
            }, {
              path: [ 'date' ],
              found: '2015-01-32',
              expected: [ 'valid date' ]
            }, {
              path: [],
              found: data,
              expected: [ 'own property "tags"' ]
            }
          ]);
      });
    });
  });
})();

// TODO: Package common validations and utility methods in a module.
