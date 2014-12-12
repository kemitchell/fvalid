/* jshint node: true */
/* globals describe, it */
(function() {
  'use strict';

  var semver = require('semver');
  var path = require('path');

  var commonjs = require('../package.json');
  var bower = require('../bower.json');
  var library = require(path.join(__dirname, '..', commonjs.main));

  var itIsTheSame = function(property) {
    it('is the same for NPM and Bower', function() {
      commonjs[property].should.eql(bower[property]);
    });
  };

  var itMatchesModule = function(property) {
    it('is the same for NPM on export', function() {
      library[property].should.eql(commonjs[property]);
    });
  };

  describe('Package', function() {
    describe('version', function() {
      it('is a valid semantic version', function() {
        semver.valid(commonjs.version).should.not.equal(null);
      });

      itIsTheSame('version');

      itMatchesModule('version');
    });

    describe('name', function() {
      itIsTheSame('name');

      itMatchesModule('name');
    });

    [
      'author',
      'description',
      'homepage',
      'keywords',
      'license',
      'repository'
    ].forEach(function(property) {
      describe(property, function() {
        itIsTheSame(property);
      });
    });
  });
})();
