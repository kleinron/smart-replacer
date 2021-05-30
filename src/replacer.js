const {serializeError} = require('serialize-error');

class ErrorReplacer {
    canHandle = (key, value) => {
      return value instanceof Error;
    }

    replace = (key, value) => {
      return serializeError(value);
    }
}

class DateReplacer {
    canHandle = (key, value) => {
      return value instanceof Date;
    }

    replace = (key, value) => {
      return value.toISOString();
    }
}

class MapReplacer {
    canHandle = (key, value) => {
      return value instanceof Map;
    }

    replace = (key, value) => {
      return Array.from(value.entries())
          .reduce((agg, [k, v]) => {
            agg[k] = v; return agg;
          }, {});
    }
}

class SetReplacer {
    canHandle = (key, value) => {
      return value instanceof Set;
    }

    replace = (key, value) => {
      return Array.from(value);
    }
}

function createCoreReplacers() {
  return [ErrorReplacer, DateReplacer, MapReplacer, SetReplacer]
      .map((c) => new c());
}

class Replacer {
    replacers;
    constructor(replacers) {
      this.replacers = Array.from(replacers || []);
    }

    replace = (key, value) => {
      for (let i = 0; i < this.replacers.length; i++) {
        const replacer = this.replacers[i];
        if (replacer.canHandle(key, value)) {
          return replacer.replace(key, value);
        }
      }
      return value;
    }

    static createReplacerFunction(options) {
      if (options === undefined) {
        options = {};
      }
      const opts = {...{
        replacers: [],
        useBuiltInReplacers: true,
        monkeyPatchJSON: false,
      }, ...options};
      const customReplacers = opts.replacers;
      const useBuiltInReplacers = opts.useBuiltInReplacers;
      const builtInReplacers = useBuiltInReplacers ? createCoreReplacers() : [];
      const replacers = [].concat(...customReplacers).concat(builtInReplacers);
      const rep = new Replacer(replacers).replace;
      if (opts.monkeyPatchJSON) {
        const stringify = JSON.stringify;
        JSON.stringify = (value, replacer, space) => {
          const actualReplacer = replacer ? replacer : rep;
          return stringify(value, actualReplacer, space);
        };
      }
      return rep;
    }

    static createReplacer(options) {
      return this.createReplacerFunction(options);
    }
}

module.exports = {
  Replacer,
};
