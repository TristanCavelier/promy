/*
 * range
 *
 * A cancellable and notification propagation Promise A+ tool to iterate a
 * range.
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

  function arrayToTypeObject(array) {
    var i, l, types = {}, type, v;
    for (i = 0, l = array.length; i < l; i += 1) {
      v = array[i];
      type = typeof v;
      types[type] = types[type] || [];
      types[type].push(v);
    }
    return types;
  }

  /**
   *     range(stop, callback): Promise
   *     range(start, stop[, step], callback): Promise
   *
   * It executes the provided `callback` once for each step between `start` and
   * `stop`. If the `callback` returns a promise, then the function will wait
   * for its fulfillment before executing the next iteration.
   *
   * `callback` is invoked with one argument:
   *
   * - the index of the step
   *
   * `start`, `stop` and `step` must be finite numbers. If `step` is not
   * provided, then the default step will be `1`. If `start` and `step` are not
   * provided, `start` will be `0` and `step` will be `1`.
   *
   * Inspired by `range()` from Python 3 built-in functions.
   *
   *     range(10, function (index) {
   *       return notifyIndex(index);
   *     }).then(onDone, onError, onNotify);
   *
   * @param  {Number} [start=0] The start index
   * @param  {Number} stop The stop index
   * @param  {Number} [step=1] One step
   * @param  {Function} callback Function to execute on each iteration.
   * @param  {Promise} A new promise with no fulfillment value.
   */
  function range(start, stop, step, callback) {
    var type_object, cancelled, current_promise;
    type_object = arrayToTypeObject([start, stop, step, callback]);

    if (type_object["function"].length !== 1) {
      throw new TypeError("range(): only one callback is needed");
    }
    start = type_object.number.length;
    if (start < 1) {
      throw new TypeError("range(): 1, 2 or 3 numbers are needed");
    }
    if (start > 3) {
      throw new TypeError("range(): only 1, 2 or 3 numbers are needed");
    }

    callback = type_object["function"][0];

    if (start === 1) {
      start = 0;
      stop = type_object.number[0];
      step = 1;
    }

    if (start === 2) {
      start = type_object.number[0];
      stop = type_object.number[1];
      step = 1;
    }

    if (start === 3) {
      start = type_object.number[0];
      stop = type_object.number[1];
      step = type_object.number[2];
      if (step === 0) {
        throw new TypeError("range(): step must not be zero");
      }
    }

    type_object = undefined;
    current_promise = resolve();
    return newPromise(function (done, fail, notify) {
      var i = start, test;
      function next() {
        if (cancelled) {
          fail(new Error("Cancelled"));
          return;
        }
        test = step > 0 ? i < stop : i > stop;
        if (test) {
          current_promise = current_promise.then(callback.bind(null, i));
          current_promise.then(next, fail, notify);
          i += step;
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
   * If the global `promy` exists, then `promy.range` is added and if the
   * global `range` does not exist, it is also provided. Else, if the global
   * `promy` does not exist, then only the global `range` will be provided.
   */
  if (root.promy) {
    root.promy.range = range;
    if (root.range === undefined) {
      root.range = range;
    }
  } else {
    root.range = range;
  }

}(this));
