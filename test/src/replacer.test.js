const { createReplacerFunction } = require('../../src/index');

const arrayToSet = (arr) => {
  return arr.reduce((agg, item) => agg.add(item), new Set());
};

const objectToMap = (obj) => {
  return Array.from(Object.entries(obj)).reduce((agg, [k, v]) => agg.set(k, v), new Map());
};

const willThrow = (msg) => {
  myThrow(msg);
};

const myThrow = (msg) => {
  throw new Error(msg);
};

describe('createReplacerFunction', () => {
  it('serializes a Set by default', () => {
    const s = new Set();
    s.add('a').add('b').add('a');
    const obj = { fld: s };
    const json = JSON.stringify(obj, createReplacerFunction());
    const parsed = JSON.parse(json);
    expect(arrayToSet(parsed.fld)).toEqual(s);
  });

  it('serializes a Map by default', () => {
    const m = new Map();
    m.set('x', 100).set('y', 4321);
    const obj = { fld: m };
    const json = JSON.stringify(obj, createReplacerFunction());
    const parsed = JSON.parse(json);
    const parsedMap = objectToMap(parsed.fld);
    expect(parsedMap).toEqual(m);
  });

  it('serializes to Map even integers as keys', () => {
    const m = new Map();
    m.set(1, 'A').set(2, [66, 77, 88]);
    const obj = { fld: m };
    const json = JSON.stringify(obj, createReplacerFunction());
    const parsed = JSON.parse(json);
    const parsedMap = objectToMap(parsed.fld);

    function convertStringToIntKeys (m) {
      return Array.from(m.entries())
        .reduce((agg, [k, v]) => agg.set(parseInt(k), v), new Map());
    }

    const intKeysMap = convertStringToIntKeys(parsedMap);
    expect(intKeysMap).toEqual(m);
  });

  it('serializes an Error by default', () => {
    const message = 'this is my message';
    let obj;
    try {
      willThrow(message);
    } catch (e) {
      obj = { fld: e };
    }
    const json = JSON.stringify(obj, createReplacerFunction());
    const parsed = JSON.parse(json);
    const errorInfo = parsed.fld;
    expect(errorInfo.message).toEqual(message);
  });

  describe('options', () => {
    class CustomSetReplacer {
      canHandle (key, value) {
        return value instanceof Set;
      }

      replace (_key, _value) {
        return 'foo';
      }
    }

    class StupidReplacer {
      canHandle (key, _value) {
        return key === 'we_found_love_in_a_hopeless_place';
      }

      replace (_key, _value) {
        return 'ta da!';
      }
    }

    it('custom replacers are evaluated before default ones', () => {
      const replacer = createReplacerFunction({ replacers: [new CustomSetReplacer()] });
      const obj = { fld: new Set() };
      const json = JSON.stringify(obj, replacer);
      const parsed = JSON.parse(json);
      const foo = parsed.fld;
      expect(foo).toEqual('foo');
    });

    it('default replacers can be disabled', () => {
      const replacer = createReplacerFunction({ useSetReplacer: false });
      const obj = { fld: new Set() };
      const nativeJson = JSON.stringify(obj);
      const parsedFromNative = JSON.parse(nativeJson);
      const setFromNative = parsedFromNative.fld;
      const replacerJson = JSON.stringify(obj, replacer);
      const parsedFromReplacer = JSON.parse(replacerJson);
      const setFromReplacer = parsedFromReplacer.fld;
      expect(setFromReplacer).toEqual(setFromNative);
    });

    it('custom replacers array can be changed externally with no impact', () => {
      const customSetReplacers = [new CustomSetReplacer()];
      const replacer = createReplacerFunction({ replacers: customSetReplacers });
      customSetReplacers[0] = null;
      const obj = { fld: new Set() };
      const json = JSON.stringify(obj, replacer);
      const parsed = JSON.parse(json);
      const foo = parsed.fld;
      expect(foo).toEqual('foo');
    });

    it('when monkey patching is explicitly set to false then not supported', () => {
      createReplacerFunction({ monkeyPatchJSON: false });
      const mySet = new Set().add('a').add('b').add('c');

      const parsedData = JSON.parse(JSON.stringify({ fld: mySet })).fld;
      expect(parsedData).toEqual({});
    });

    it('when monkey patching is explicitly set to true then supported', () => {
      createReplacerFunction({
        monkeyPatchJSON: true,
        replacers: [new StupidReplacer()]
      });
      const obj = {
        we_found_love_in_a_hopeless_place: new Set().add(10).add(20).add(30)
      };

      const parsedObj = JSON.parse(JSON.stringify(obj));
      const value = parsedObj.we_found_love_in_a_hopeless_place;
      expect(value).toEqual('ta da!');
    });
  });
});
