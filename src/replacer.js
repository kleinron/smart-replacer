'use strict';

const { serializeError } = require('serialize-error');

class NoopReplacer {
  canHandle (_key, _value) {
    return true;
  }

  replace (key, value) {
    return value;
  }
}

class ErrorReplacer {
  canHandle (key, value) {
    return value instanceof Error;
  }

  replace (key, value) {
    return serializeError(value);
  }
}

class MapReplacer {
  canHandle (key, value) {
    return value instanceof Map;
  }

  replace (key, value) {
    return Array.from(value.entries())
      .reduce((agg, [k, v]) => {
        agg[k] = v; return agg;
      }, {});
  }
}

class SetReplacer {
  canHandle (key, value) {
    return value instanceof Set;
  }

  replace (key, value) {
    return Array.from(value);
  }
}

function createCoreReplacers (options) {
  return Object.entries({
    useErrorReplacer: new ErrorReplacer(),
    useMapReplacer: new MapReplacer(),
    useSetReplacer: new SetReplacer()
  }).reduce((agg, [k, v]) => {
    if (options[k]) {
      agg.push(v);
    }
    return agg;
  }, []);
}

class Replacer {
  static createReplacerFunction (options) {
    if (options === undefined) {
      options = {};
    }
    const opts = {
      ...{
        replacers: [],
        useErrorReplacer: true,
        useMapReplacer: true,
        useSetReplacer: true,
        monkeyPatchJSON: false
      },
      ...options
    };
    const customReplacers = [...opts.replacers];
    const coreReplacers = createCoreReplacers(opts);
    const replacers = []
      .concat(customReplacers)
      .concat(coreReplacers)
      .concat([new NoopReplacer()]);

    const replacerFn = (key, value) => {
      const replacer = replacers.find(r => r.canHandle(key, value));
      return replacer.replace(key, value);
    };

    if (opts.monkeyPatchJSON) {
      const stringify = JSON.stringify;
      JSON.stringify = (value, replacer, space) => {
        const actualReplacer = replacer || replacerFn;
        return stringify(value, actualReplacer, space);
      };
    }

    return replacerFn;
  }

  static createReplacer (options) {
    return this.createReplacerFunction(options);
  }
}

module.exports = {
  Replacer
};
