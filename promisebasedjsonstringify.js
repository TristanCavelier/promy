/*jslint indent: 2, maxlen: 80 */

(function factory(root) {
  "use strict";

  /*
   * Promise based JSON.stringify
   *
   * A cancellable and notification propagation Promise A+ tool to convert value
   * to JSON.
   *
   * Version: v1.1.0
   *
   * Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
   * This program is free software. It comes without any warranty, to
   * the extent permitted by applicable law. You can redistribute it
   * and/or modify it under the terms of the Do What The Fuck You Want
   * To Public License, Version 2, as published by Sam Hocevar. See
   * the COPYING file for more details.
   */

  var isArray = Array.isArray;

  /*
   * It uses by default `promy.Promise` as promise mechanism. If `promy` is not
   * provided, then the global `Promise` will be used instead.
   */
  function newPromise(executor, canceller) {
    var Cons = ((root.promy && root.promy.Promise) || root.Promise);
    return new Cons(executor, canceller);
  }

  function resolve(v) {
    return newPromise(function (done) { done(v); });
  }

  /*
   * It can use `promy.CancellableChain` or the global `CancellableChain` as
   * chaining mechanism. If they are not provided, it will use the normal
   * `Promise` chaining mechanism.
   */
  function chain(value) {
    var Cons = ((root.promy && root.promy.CancellableChain) ||
                root.CancellableChain);
    if (!Cons) { return resolve(value); }
    return new Cons(value);
  }

  function map(array, callback) {
    return ((root.promy && root.promy.map) || root.map)(array, callback);
  }

  function all(array) {
    return ((root.promy && root.promy.Promise && root.promy.Promise.all) ||
            (root.Promise && root.Promise.all))(array);
  }

  function concatStringNTimes(string, n) {
    /*jslint plusplus: true */
    var res = "";
    while (--n >= 0) { res += string; }
    return res;
  }

  function joinArray(array, deep, indent) {
    var i, l = array.length, prefix, res;
    if (l === 0) {
      return "[]";
    }
    if (indent) {
      prefix = concatStringNTimes(indent, deep);
      res = "[\n" + prefix + indent;
      if (0 < l) {
        if (array[0] === undefined) {
          res += "null";
        } else {
          res += array[0];
        }
        for (i = 1; i < l; i += 1) {
          if (array[i] === undefined) {
            res += ",\n" + prefix + indent + "null";
          } else {
            res += ",\n" + prefix + indent + array[i];
          }
        }
      }
      return res + "\n" + prefix + "]";
    }
    res = "[";
    if (0 < l) {
      if (array[0] === undefined) {
        res += "null";
      } else {
        res += array[0];
      }
      for (i = 1; i < l; i += 1) {
        if (array[i] === undefined) {
          res += ",null";
        } else {
          res += "," + array[i];
        }
      }
    }
    return res + "]";
  }

  function joinObject(array, keys, deep, indent) {
    var i, l = array.length, res, prefix;
    if (l === 0) {
      return "{}";
    }
    if (indent) {
      prefix = concatStringNTimes(indent, deep);
      res = "{\n" + prefix + indent;
      if (0 < l) {
        if (array[0] !== undefined) {
          res += "\"" + keys[0] + "\": " + array[0];
        }
        for (i = 1; i < l; i += 1) {
          if (array[i] !== undefined) {
            res += ",\n" + prefix + indent + "\"" + keys[i] + "\": " + array[i];
          }
        }
      }
      return res + "\n" + prefix + "}";
    }
    res = "{";
    if (0 < l) {
      if (array[0] !== undefined) {
        res += "\"" + keys[0] + "\":" + array[0];
      }
      for (i = 1; i < l; i += 1) {
        if (array[i] !== undefined) {
          res += ",\"" + keys[i] + "\":" + array[i];
        }
      }
    }
    return res + "}";
  }

  /**
   *     jsonStringify(value[, replacer[, space[, option]]]): Promise
   *     jsonStringify(value[, option]): Promise
   *
   * Acts like the well known `JSON.stringify` with asynchronous operation. If
   * the `replacer` returns a promise, then the function will wait for its
   * fulfillment before executing the next operation.
   *
   * Inspired by `JSON.stringify` from Mozilla Developer Network.
   *
   *     jsonStringify({'a': 'b'}).then(function (val) {
   *       // val -> '{"a":"b"}'
   *     });
   *
   * @param  {Any} value The value to convert to a JSON string.
   * @param  {Function,Array} [replacer] See MDN documentation.
   * @param  {String,Number} [space] Causes the output to be pretty-printed.
   * @param  {Object} [option] XXX
   * @param  {Boolean} [option.parallel=false] XXX
   * @param  {Boolean,Function} [option.sort=false] XXX
   * @return {Promise} A new promise with the JSON string as fulfillment value.
   */
  function jsonStringify(value, replacer, space, option) {
    var parallel, sort, indent;

    // prepare options
    if (typeof replacer === "object" && replacer !== null &&
        !isArray(replacer)) {
      option = replacer;
      replacer = option.replacer;
      space = option.space;
    } else if (typeof space === "object" && space !== null &&
               !isArray(space)) {
      option = space;
      space = option.space;
    } else {
      option = option || {};
    }
    parallel = option.parallel;
    sort = option.sort;

    if (sort && isArray(replacer)) {
      replacer.sort();
    }

    // prepare beautifier
    if (typeof space === "string") {
      if (space !== "") {
        indent = space;
      }
    } else if (typeof space === "number") {
      if (isFinite(space) && space > 0) {
        indent = concatStringNTimes(" ", space);
      }
    }

    function jsonStringifyRec(key, value, deep) {
      if (value && value.toJSON === "function") {
        value = value.toJSON();
      }
      if (typeof replacer === "function") {
        value = replacer(key, value);
      }
      return chain(value).then(function (value) {
        if (isArray(value)) {
          if (parallel) {
            // parse array values at the same time
            return all(value.map(function (value, index) {
              return jsonStringifyRec(index, value, deep + 1);
            })).then(function (array) {
              return joinArray(array, deep, indent);
            });
          }
          // parse array values sequentialy
          return map(value, function (value, index) {
            return jsonStringifyRec(index, value, deep + 1);
          }).then(function (array) {
            return joinArray(array, deep, indent);
          });
        }
        if (typeof value === "object" && value !== null) {
          if (isArray(replacer)) {
            key = replacer;
          } else {
            key = Object.keys(value);
            if (sort) {
              key.sort(sort);
            }
          }
          if (parallel) {
            // parse keys at the same time
            return all(key.map(function (c) {
              return jsonStringifyRec(c, value[c], deep + 1);
            })).then(function (array) {
              return joinObject(array, key, deep, indent);
            });
          }
          // parse keys sequentialy
          return map(key, function (k) {
            return jsonStringifyRec(k, value[k], deep + 1);
          }).then(function (array) {
            return joinObject(array, key, deep, indent);
          });
        }
        return JSON.stringify(value);
      });
    }
    return jsonStringifyRec("", value, 0).detach();
  }

  /*
   * If the global `promy` exists, then `promy.jsonStringify` is added and if
   * the global `jsonStringify` does not exist, it is also provided. Else, if
   * the global `promy` does not exist, then only the global `jsonStringify`
   * will be provided.
   */
  if (root.promy) {
    root.promy.jsonStringify = jsonStringify;
    if (root.jsonStringify === undefined) {
      root.jsonStringify = jsonStringify;
    }
  } else {
    root.jsonStringify = jsonStringify;
  }

  /**
   * Prepare `toScript` function to export easily this library as a string.
   */
  Object.defineProperty(jsonStringify, "toScript", {
    "configurable": true,
    "enumerable": false,
    "writable": true,
    "value": function () {
      return "(" + factory.toString() + "(this));";
    }
  });

}(this));
