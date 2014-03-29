/*
 * Promise based reduce
 *
 * A cancellable and notification propagation Promise A+ tool to iterate an
 * array to reduce it to a single value.
 *
 * Version: v1.0.0
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

  function resolve(v) {
    return newPromise(function (done) { done(v); });
  }

  function reject(e) {
    return newPromise(function (done, fail) {
      /*jslint unparam: true */
      fail(e);
    });
  }

  /**
   *     reduce(array, callback[, initialValue]): Promise< reduced_value >
   *
   * It executes the `callback` function once for each element present in the
   * array, excluding holes in the array, receiving four arguments: the initial
   * value (or value from the previous `callback` call), the value of the
   * current element, the current index, and the array over which iteration is
   * occurring. If the `callback` returns a promise, then the function will take
   * its fulfillment value as returned value before executing the next
   * iteration.
   *
   * `callback` is invoked with four arguments:
   *
   * - `previousValue`: the value previously returned in the last invocation of
   *    the callback, or `initialValue`, if supplied. (See below.)
   * - `currentValue`: the current element being processed in the array.
   * - `index`: the index of the current element being processed in the array.
   * - `array`: the array `reduce` was called upon.
   *
   * The first time the callback is called, `previousValue` and `currentValue`
   * can be one of two values. If `initialValue` is provided in the call to
   * `reduce`, then `previousValue` will be equal to `initialValue` and
   * `currentValue` will be equal to the first value in the array. If no
   * `initialValue` was provided, then `previousValue` will be equal to the
   * first value in the array and `currentValue` will be equal to the second.
   *
   * Inspired by `Array.prototype.reduce` from Mozilla Developer Network.
   *
   *     reduce([11111, 22222, 33333], function(a, b) {
   *       return workerMultiply(a, b);
   *     }).then(function (total) {
   *       // total = 11111 * 22222 * 33333 = 8230205763786
   *     });
   *
   * @param  {Array} array The array to parse
   * @param  {Function} callback Function to execute on each element in the
   *                             array.
   * @param  {Any} [initialValue] Object to use as the first argument to the
   *                              first call of the callback
   * @return {Promise} A new promise with reduced value as fulfillment value.
   */
  function reduce(array, callback, init) {
    if (arguments.length === 0) {
      throw new TypeError("reduce(): missing argument 1");
    }
    if (!isArray(array)) {
      throw new TypeError("reduce(): argument 1 is not an array");
    }
    if (arguments.length === 1) {
      throw new TypeError("reduce(): missing argument 2");
    }
    if (typeof callback !== "function") {
      throw new TypeError("reduce(): argument 2 is not a function");
    }
    var i = 0, previous = init, cancelled, current_promise;
    if (arguments.length === 2) {
      i = 1;
      previous = array[0];
    }
    if (array.length === 0) {
      if (i === 1) {
        return reject(
          new TypeError("Reduce of empty array with no initial value")
        );
      }
      return resolve(init);
    }
    if (array.length === 1 && i === 0) {
      return resolve(array[0]);
    }
    current_promise = resolve();
    return new Promise(function (done, fail, notify) {
      function next(prev) {
        if (cancelled) {
          fail(new Error("Cancelled"));
          return;
        }
        if (i < array.length) {
          current_promise =
            current_promise.then(callback.bind(null, prev, array[i], i, array));
          current_promise.then(next, fail, notify);
          i += 1;
          return;
        }
        done(prev);
      }
      next(previous);
    }, function () {
      cancelled = true;
      if (typeof current_promise.cancel === "function") {
        current_promise.cancel();
      }
    });
  }

  /*
   * If the global `promy` exists, then `promy.reduce` is added and if the
   * global `reduce` does not exist, it is also provided. Else, if the global
   * `promy` does not exist, then only the global `reduce` will be provided.
   */
  if (root.promy) {
    root.promy.reduce = reduce;
    if (root.reduce === undefined) {
      root.reduce = reduce;
    }
  } else {
    root.reduce = reduce;
  }

}(this));
