fvalid.js
=========

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
    this.pass() :
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
