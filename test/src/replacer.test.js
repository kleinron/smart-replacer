const { Replacer } = require('../../src/replacer');

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

describe('Replacer', () => {
  it('works with default constructor', () => {
    const replacer = new Replacer();
    const obj = { a: 123 };
    const json = JSON.stringify(obj, replacer.createReplacer());
    const parsed = JSON.parse(json);
    expect(parsed.a).toEqual(123);
  });

  it('works with a custom replacer', () => {
    const numReplacer = {
      canHandle: (key, value) => {
        return (typeof value === 'number') || (value instanceof Number);
      },
      replace: (key, value) => {
        return value + 100;
      }
    };
    const replacer = new Replacer([numReplacer]);
    const obj = { a: 7 };
    const json = JSON.stringify(obj, replacer.createReplacer());
    const parsed = JSON.parse(json);
    expect(parsed.a).toEqual(107);
  });

  describe('createReplacerFunction', () => {
    it('serializes a Set by default', () => {
      const s = new Set();
      s.add('a').add('b').add('a');
      const obj = { fld: s };
      const json = JSON.stringify(obj, Replacer.createReplacerFunction());
      const parsed = JSON.parse(json);
      expect(arrayToSet(parsed.fld)).toEqual(s);
    });

    it('serializes a Map by default', () => {
      const m = new Map();
      m.set('x', 100).set('y', 4321);
      const obj = { fld: m };
      const json = JSON.stringify(obj, Replacer.createReplacerFunction());
      const parsed = JSON.parse(json);
      const parsedMap = objectToMap(parsed.fld);
      expect(parsedMap).toEqual(m);
    });

    it('serializes a Date by default', () => {
      const d = new Date(1948, 3, 25);
      const obj = { fld: d };
      const json = JSON.stringify(obj, Replacer.createReplacerFunction());
      const parsed = JSON.parse(json);
      const dateAsString = parsed.fld;
      const parsedDate = new Date(dateAsString);
      expect(parsedDate).toEqual(d);
    });

    it('serializes an Error by default', () => {
      const message = 'this is my message';
      let obj;
      try {
        willThrow(message);
      } catch (e) {
        obj = { fld: e };
      }
      const json = JSON.stringify(obj, Replacer.createReplacerFunction());
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
        const replacer = Replacer.createReplacerFunction({ replacers: [new CustomSetReplacer()] });
        const obj = { fld: new Set() };
        const json = JSON.stringify(obj, replacer);
        const parsed = JSON.parse(json);
        const foo = parsed.fld;
        expect(foo).toEqual('foo');
      });

      it('default replacers can be disabled', () => {
        const replacer = Replacer.createReplacerFunction({ useBuiltInReplacers: false });
        const obj = { fld: new Set() };
        const nativeJson = JSON.stringify(obj);
        const parsedFromNative = JSON.parse(nativeJson);
        const setFromNative = parsedFromNative.fld;
        const replacerJson = JSON.stringify(obj, replacer);
        const parsedFromReplacer = JSON.parse(replacerJson);
        const setFromReplacer = parsedFromReplacer.fld;
        expect(setFromReplacer).toEqual(setFromNative);
      });

      it('when monkey patching is explicitly set to false then not supported', () => {
        Replacer.createReplacerFunction({ monkeyPatchJSON: false });
        const mySet = new Set().add('a').add('b').add('c');

        const parsedData = JSON.parse(JSON.stringify({ fld: mySet })).fld;
        expect(parsedData).toEqual({});
      });

      it('when monkey patching is explicitly set to true then supported', () => {
        Replacer.createReplacerFunction({
          monkeyPatchJSON: true,
          replacers: [new StupidReplacer()],
          useBuiltInReplacers: false
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
});
