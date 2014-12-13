/* jshint node: true, expr: true */
/* globals describe, it */
(function() {
  'use strict';

  // Long-form examples of validations for a cartoon microblog
  describe('Blog Example', function() {
    var fvalid = require('../lib/fvalid');

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
          this.ok :
          this.expected('object');
      };

      var isArray = function(x) {
        return Array.isArray(x) ?
          this.ok :
          this.expected('array');
      };

      var ofType = function(type) {
        return function(x) {
          return typeof x === type ?
            this.ok :
            this.expected(type);
        };
      };

      var notEmpty = function(x) {
        return x.length === 0 ?
          this.expected('non-empty string') :
          this.ok;
      };

      var maxLength = function(len) {
        return function(x) {
          return x.length <= len ?
            this.ok :
            this.expected('string of ' + len + ' characters or less');
        };
      };

      var matchesRegEx = function(re) {
        return function(x) {
          return re.test(x) ?
            this.ok :
            this.expected('string matching ' + re.toString());
        };
      };

      var validDateString = function(string) {
        var match = /^(\d\d\d\d)-(\d\d)-(\d\d)$/.exec(string);
        var args = match.slice(1, 4).map(Number);
        var date = new Date(args);
        return isNaN(date.getTime()) ?
          this.expected('valid date') :
          this.ok;
      };

      var isString = ofType('string');

      var allUpperCase = function(string) {
        var up = string.toUpperCase();
        return up === string ?
          this.ok : this.expected('upper-case string');
      };

      validators.post = _.and(
        isObject,
        _.ownProperty('text', _.and(
          isString,
          notEmpty,
          maxLength(140)
        )),
        _.ownProperty('author', _.and(
          isString,
          notEmpty
        )),
        _.ownProperty('date', _.and(
          isString,
          matchesRegEx(/^\d\d\d\d-\d\d-\d\d$/),
          validDateString
        )),
        _.ownProperty('tags', _.and(
          isArray,
          notEmpty,
          _.eachItem(_.and(
            isString,
            notEmpty,
            _.or(
              matchesRegEx(/^@[A-Z]+$/),
              allUpperCase
            )
          ))
        ))
      );
    })();

    describe('post', function() {
      it('matches a valid example', function() {
        var data = {
          text: 'This is a valid post',
          author: 'John',
          date: '2015-01-01',
          tags: [ 'TESTING', '@JOAN' ]
        };
        fvalid.validate(data, validators.post)
          .should.be.empty;
      });

      it('rejects an invalid example', function() {
        var data = {
          text: 'This is a valid post',
          author: '',
          date: '2015-01-32'
        };
        fvalid.validate(data, validators.post)
          .should.eql([ {
            path: [ 'author' ],
            found: '',
            expected: 'non-empty string'
          }, {
            path: [ 'date' ],
            found: '2015-01-32',
            expected: 'valid date'
          }, {
            path: [],
            found: data,
            expected: 'own property "tags"'
          } ]);
      });
    });
  });
})();

// TODO: Package common validations and utility methods in a module.
