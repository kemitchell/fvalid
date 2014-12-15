fvalid.js
=========

[![NPM version](https://img.shields.io/npm/v/fvalid.svg)](https://www.npmjs.com/package/fvalid)
[![build status](https://travis-ci.org/kemitchell/fvalid.js.svg)](http://travis-ci.org/kemitchell/fvalid.js)

Validate arbitrarily nested objects with functions

```bash
npm install --save-dev fvalid
bower install fvalid
```

`fvalid` utilizes ECMA-262 5th edition functions like `reduce`. It does not depend on any other modules.

The [test suite](./test) has usage examples, including a toy [micro-blog post format validator](./test/blog.js).

Developers shopping for a JavaScript validation library should also consider [JSON Schema](http://www.json-schema.org) and [Joi](https://www.npmjs.com/package/joi).
