fvalid.js
=========

[![NPM version](https://img.shields.io/npm/v/fvalid.svg)](https://www.npmjs.com/package/fvalid)
[![build status](https://travis-ci.org/kemitchell/fvalid.js.svg)](http://travis-ci.org/kemitchell/fvalid.js)

[![browser support](https://ci.testling.com/kemitchell/fvalid.js.png)](https://ci.testling.com/kemitchell/fvalid.js)

Validate arbitrarily nested objects with functions

```bash
  npm install --save-dev fvalid
  bower install fvalid
```

The module has no external dependencies. It utilizes on ECMA-262 5th edition functions like `reduce`.

For example:

```javascript
var good = { name: 'John' };
var bad = { name: '' };

var validator = fvalid.ownProperty('name', function(x) {
  return x.length > 0 ?
    this.ok :
    this.expected('non-empty string');
});

fvalid.validate(good, validator);
// => []
fvalid.valid(good, validator);
// => true

fvalid.validate(bad, validator);
// => [ { path: [ 'name' ], found: '', expected: 'non-empty string' } ]
fvalid.valid(bad, validator);
// => false
```

See also various examples in the [test suite](./test), including for a toy [micro-blog post format](./test/blog.js).
