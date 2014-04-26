/*jslint indent: 2, maxlen: 80, nomen: true */
/*global Promise, console */

(function factory(root) {
  "use strict";

  /*
   * range
   *
   * A cancellable and notification propagation Promise A+ tool to iterate a
   * range.
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
      /*jslint ass: true */
      (types[type] = types[type] || []).push(v);
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
    var type_object, cancelled, p1, p2;
    type_object = arrayToTypeObject([start, stop, step, callback]);

    if (type_object["function"].length !== 1) {
      throw new TypeError("range(): only one callback is needed");
    }
    start = type_object.number.length;
    if (start < 1) {
      throw new TypeError("range(): 1, 2 or 3 numbers are needed");
    }
    callback = type_object["function"][0];
    if (start === 1) {
      start = 0;
      stop = type_object.number[0];
      step = 1;
    } else if (start === 2) {
      start = type_object.number[0];
      stop = type_object.number[1];
      step = 1;
    } else if (start === 3) {
      start = type_object.number[0];
      stop = type_object.number[1];
      step = type_object.number[2];
      if (step === 0) {
        throw new TypeError("range(): step must not be zero");
      }
    } else {
      throw new TypeError("range(): only 1, 2 or 3 numbers are needed");
    }

    type_object = undefined;
    p1 = resolve();
    return newPromise(function (done, fail, notify) {
      var i = start, test, value;
      function next() {
        test = step > 0 ? i < stop : i > stop;
        if (test) {
          try {
            value = callback(i);
          } catch (e) {
            fail(e);
            return;
          }
          if (cancelled) { return; }
          i += step;
          if (value && typeof value.then === "function") {
            p1 = value;
            p2 = value.then(next, fail, notify);
          } else {
            p2 = p2.then(next, fail, notify);
          }
          return;
        }
        done();
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

  /**
   * Prepare `toScript` function to export easily this library as a string.
   */
  Object.defineProperty(range, "toScript", {
    "configurable": true,
    "enumerable": false,
    "writable": true,
    "value": function () {
      return "(" + factory.toString() + "(this));";
    }
  });

}(this));
