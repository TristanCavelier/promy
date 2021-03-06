/*jslint indent: 2, maxlen: 80 */

(function factory(root) {
  "use strict";

  /*
   * Promise based map
   *
   * A cancellable and notification propagation Promise A+ tool to map an array.
   *
   * Version: v1.1.1
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

  function resolve() {
    return newPromise(function (done) { done(); });
  }

  /**
   *     map(array, callback[, thisArg]): Promise
   *
   * It executes the provided `callback` once for each element in an array, in
   * order, and constructs a new array from the results asynchronously. If the
   * `callback` returns a promise, then the function will wait for its
   * fulfillment before executing the next iteration.
   *
   * `callback` is invoked with three arguments:
   *
   * - the element value
   * - the element index
   * - the array being traversed
   *
   * If a `thisArg` parameter is provided to `forEach`, it will be passed to
   * `callback` when invoked, for use as its `this` value.  Otherwise, the value
   * `undefined` will be passed for use as its `this` value.
   *
   * Unlike `Array.prototype.map`, you can stop the iteration by throwing
   * something, or by doing a `cancel` to the returned promise if it is
   * cancellable promise.
   *
   * Inspired by `Array.prototype.map` from Mozilla Developer Network.
   *
   *     map(["a", "b", "c"], function (value, index, array) {
   *       return ajaxGetValueSomewhere(value);
   *     }).then(onDone, onError, onNotify);
   *
   * @param  {Array} array The array to parse
   * @param  {Function} callback Function to execute for each element.
   * @param  {Any} [thisArg] Value to use as `this` when executing `callback`.
   * @return {Promise} A new promise with a mapped array as fulfillment value.
   */
  function map(array, callback, thisArg) {
    if (arguments.length === 0) {
      throw new TypeError("map(): missing argument 1");
    }
    if (!isArray(array)) {
      throw new TypeError("map(): argument 1 is not an array");
    }
    if (arguments.length === 1) {
      throw new TypeError("map(): missing argument 2");
    }
    if (typeof callback !== "function") {
      throw new TypeError("map(): argument 2 is not a function");
    }
    var cancelled, p1 = resolve(), p2, result = [], maxlength = array.length;
    return newPromise(function (done, fail, notify) {
      var i = 0;
      function next(value) {
        if (i > 0) {
          result[i - 1] = value;
        }
        if (i < array.length && i < maxlength) {
          try {
            value = callback.call(thisArg, array[i], i, array);
          } catch (e) {
            fail(e);
            return;
          }
          if (cancelled) { return; }
          i += 1;
          if (value && typeof value.then === "function") {
            p1 = value;
            p2 = value.then(next, fail, notify);
          } else {
            p2 = p2.then(next.bind(null, value), fail, notify);
          }
          return;
        }
        done(result);
      }
      p2 = p1.then(next);
    }, function () {
      cancelled = true;
      if (typeof p1.cancel === "function") {
        p1.cancel();
      }
      if (typeof p2.cancel === "function") {
        p2.cancel();
      }
    });
  }

  /*
   * If the global `promy` exists, then `promy.map` is added and if the global
   * `map` does not exist, it is also provided. Else, if the global `promy` does
   * not exist, then only the global `map` will be provided.
   */
  if (root.promy) {
    root.promy.map = map;
    if (root.map === undefined) {
      root.map = map;
    }
  } else {
    root.map = map;
  }

  /**
   * Prepare `toScript` function to export easily this library as a string.
   */
  Object.defineProperty(map, "toScript", {
    "configurable": true,
    "enumerable": false,
    "writable": true,
    "value": function () {
      return "(" + factory.toString() + "(this));";
    }
  });

}(this));
