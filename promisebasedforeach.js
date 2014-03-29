/*
 * Promise based forEach
 *
 * A cancellable and notification propagation Promise A+ tool to iterate an
 * array.
 *
 * Version: v1.0.1
 *
 * Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * the COPYING file for more details.
 */

/*jslint indent: 2, maxlen: 80, nomen: true */
/*global Promise, console */

(function (root) {
  "use strict";

  var isArray = Array.isArray;

  /*
   * It uses by default `promy.Promise` as promise mechanism. If `promy` is not
   * provided, then the global `Promise` will be used instead.
   */
  function newPromise(executor, canceller) {
    var Cons = ((root.promy && root.promy.Promise) || root.Promise);
    return new Cons(
      executor,
      canceller
    );
  }

  function resolve() {
    return newPromise(function (done) { done(); });
  }

  /**
   *     forEach(array, callback[, thisArg]): Promise
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
   *     forEach(["a", "b", "c"], function (value, index, array) {
   *       return ajaxPostValueSomewhere(value);
   *     }).then(onDone, onError, onNotify);
   *
   * @param  {Array} array The array to parse
   * @param  {Function} callback Function to execute for each element.
   * @param  {Any} [thisArg] Value to use as `this` when executing `callback`.
   * @return {Promise} A new promise with no fulfillment value.
   */
  function forEach(array, callback, thisArg) {
    if (arguments.length === 0) {
      throw new TypeError("forEach(): missing argument 1");
    }
    if (!isArray(array)) {
      throw new TypeError("forEach(): argument 1 is not an array");
    }
    if (arguments.length === 1) {
      throw new TypeError("forEach(): missing argument 2");
    }
    if (typeof callback !== "function") {
      throw new TypeError("forEach(): argument 2 is not a function");
    }
    var cancelled, current_promise = resolve();
    return newPromise(function (done, fail, notify) {
      var i = 0;
      function next() {
        if (cancelled) {
          fail(new Error("Cancelled"));
          return;
        }
        if (i < array.length) {
          current_promise =
            current_promise.then(callback.bind(thisArg, array[i], i, array));
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

  /*
   * If the global `promy` exists, then `promy.forEach` is added and if the
   * global `forEach` does not exist, it is also provided. Else, if the global
   * `promy` does not exist, then only the global `forEach` will be provided.
   */
  if (root.promy) {
    root.promy.forEach = forEach;
    if (root.forEach === undefined) {
      root.forEach = forEach;
    }
  } else {
    root.forEach = forEach;
  }

}(this));
