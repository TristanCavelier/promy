// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80, nomen: true */
/*global Promise, console */

(function (root) {
  "use strict";

  var Promise, resolve, isArray;

  if (root.promy) {
    Promise = root.promy.Promise;
  } else {
    Promise = root.Promise;
  }

  if (typeof Promise !== "function") {
    // Promise is not a constructor
    Promise(); // throw error here
  }

  resolve = Promise.resolve;

  if (typeof resolve !== "function") {
    // Promise.resolve is not a function
    resolve(); // throw error here
  }

  isArray = Array.isArray;

  if (typeof isArray !== "function") {
    isArray(); // throw error here
  }

  /**
   * forEach(array, callback[, thisArg]): Promise
   *
   * It executes the provided `callback` once for each element of the array with
   * an assigned value asynchronously. If the `callback` returns a promise, then
   * the function will wait for its fulfillment before executing the next
   * iteration.
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
   * Unlike `Array.prototype.forEach`, you can stop the iteration by throwing
   * something, or by doing a `cancel` to the returned promise if it is
   * cancellable promise.
   *
   * Inspired by `Array.prototype.forEach` from Mozilla Developer Network.
   *
   * @param  {Array} array The array to parse
   * @param  {Function} callback Function to execute for each element.
   * @param  {Any} [thisArg] Value to use as `this` when executing `callback`.
   * @param  {Promise} A new promise.
   */
  function forEach(array, fn, thisArg) {
    if (arguments.length === 0) {
      throw new TypeError("missing argument 0 when calling function forEach");
    }
    if (!isArray(array)) {
      throw new TypeError(array + " is not an array");
    }
    if (arguments.length === 1) {
      throw new TypeError("missing argument 1 when calling function forEach");
    }
    if (typeof fn !== "function") {
      throw new TypeError(fn + " is not a function");
    }
    var cancelled, current_promise = resolve();
    return new Promise(function (done, fail, notify) {
      var i = 0;
      function next() {
        if (cancelled) {
          fail(new Error("Cancelled"));
          return;
        }
        if (i < array.length) {
          current_promise =
            current_promise.then(fn.bind(thisArg, array[i], i, array));
          current_promise.then(next, fail, notify);
          i += 1;
          return;
        }
        done();
      }
      next();
    }, function () {
      cancelled = true;
      if (typeof current_promise.cancel === "function") {
        current_promise.cancel();
      }
    });
  }

  // export
  if (root.promy) {
    root.promy.forEach = forEach;
    if (root.forEach === undefined) {
      root.forEach = forEach;
    }
  } else {
    root.forEach = forEach;
  }

}(this));
