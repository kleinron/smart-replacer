# smart-replacer
An extensible JSON stringify replacer with default support for error objects, sets, and maps.

## Installation
```bash
npm install smart-serializer
```

## Usage
```javascript
const { Replacer } = require('smart-replacer');

const movie = {
  name: "Star Wars",
  cast: new Map().set("director", "George Lucas").set("producer", "Gary Kurtz"),
  actors: new Set(["Mark Hamill", "Harrison Ford", "Carrie Fisher", "Peter Cushing", "Alec Guinness"])
};

// default output of JSON.stringify
console.log(JSON.stringify(movie));
// => {"name":"Star Wars","cast":{},"actors":{}}

// replacer in action
console.log(JSON.stringify(movie, Replacer.createReplacerFunction()));
// => {"name":"Star Wars","cast":{"director":"George Lucas","producer":"Gary Kurtz"},"actors":["Mark Hamill","Harrison Ford","Carrie Fisher","Peter Cushing","Alec Guinness"]}

// replacer with monkey patching
Replacer.createReplacerFunction({monkeyPatchJSON: true});
console.log(JSON.stringify(movie));
// => {"name":"Star Wars","cast":{"director":"George Lucas","producer":"Gary Kurtz"},"actors":["Mark Hamill","Harrison Ford","Carrie Fisher","Peter Cushing","Alec Guinness"]}
```

## Motivation
Have you ever tried to JSON serialize an error object or a Map?
It seems that JavaScript (or ECMAScript, whatever...)
doesn't support serialization of these types out-of-the-box.
Properly serializing objects to JSON can be a great advantage when it comes to structured logging.

## API
The single function `Replacer.createReplacerFunction(options?)` takes an `options` parameter (optional), 
and returns a replacer function, which becomes handy when using [`JSON.stringify`](https://262.ecma-international.org/6.0/#sec-json.stringify)

__options__
* `useErrorReplacer`: boolean (default: `true`) - should the replacer convert the error object
* `useMapReplacer`: boolean (default: `true`) - should the replacer convert a `Map` object to a "regular" object
* `useSetReplacer`: boolean (default: `true`) - should the replacer convert a `Set` object to an array
* `replacers`: array (default: `[]`) - an array of implementation of "Replacer" interface (see below) to be used
* `monkeyPatchJSON`: boolean (default: `false`) - should the call have a side effect on the global `JSON` object, so that the resulting `replacer` function would be also used as an argument to `JSON.stringify`. [Monkey patching](https://en.wikipedia.org/wiki/Monkey_patch) is nice and all, but use with caution.

### Extensibility
If one wishes to add their own logic, this can be easily done using the following protocol.

__Replacer interface__

The following interface is a "Replacer":
```javascript
canHandle(key, value); // returns boolean
replace(key, value); // returns the replaced result
```

__The protocol__

Custom logic can be applied using one or more instances of the `Replacer` interface described above.
These instances should be passed in the `replacers` field of the `options` argument.

The main replacer function would do the following:
```text
for each key-value pair that are evaluated during the `JSON.stringify` execution:
  for each customReplacer in options.replacers:
    if customReplacer.canHandle(key, value) then
      return customReplacer.replace(key, value) and we're done
  for each coreReplacer in enabled core replacers (for Error, Map, and Set):
    if coreReplacer.canHandle(key, value) then
      return coreReplacer.replace(key, value) and we're done
  otherwise, return value // unchanged
```
See tests for custom logic implementation.

## Notes
* This project serializes a `Set` to an array and a `Map` to an object. This means that once serialized to JSON, 
  there's no way to blindly deserialize it back to in-memory objects. <br/> 
  For logging purposes that's fine, but for other scenarios, one might need to know the desired schema in advance for proper deserialization.
* A `Map` object is serialized to a regular object with keys as strings. This means that another extra step would be needed if the keys of the original `Map` were numbers, for instance.
* If `options.monkeyPatchJSON` is set to `true`, then `JSON.stringify` acts differently: if the `replacer` argument is missing, or set to `undefined`, `null`, `0` or `false` (anything evaluated to `false`, basically), then the actual replacer to be used is the one returned from the function `Replacer.createReplacerFunction`. If, however, the code that calls `JSON.stringify` explicitly provides a replacer function `f`, then `f` would be used as the actual replacer.

## Testing

First, install the dev dependencies:
```bash
npm install --dev
```
then:
```bash
npm test
```

## Thanks
* This project wraps the great work that Sindre Sorhus has done in [serialize-error](https://github.com/sindresorhus/serialize-error)

## License
MIT &copy; Ron Klein