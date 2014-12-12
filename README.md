fvalid.js
=========

[![build status](https://travis-ci.org/kemitchell/fvalid.svg)](http://travis-ci.org/kemitchell/fvalid)

Validate arbitrarily nested objects with functions

```bash
  npm install --save-dev fvalid
  bower install fvalid
```

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
