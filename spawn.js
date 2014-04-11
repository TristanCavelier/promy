/*
 * Spawn
 *
 * A cancellable and notification propagation Promise A+ tool to write
 * asynchronous operations with a simple genetor function.
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

/*jslint indent: 2, maxlen: 80 */
/*global setTimeout, clearTimeout */

(function (root) {
  "use strict";

  /*
   * It uses by default `promy.Promise` as promise mechanism. If `promy` is not
   * provided, then the global `Promise` will be used instead.
   */
  function newPromise(executor, canceller) {
    var Cons = ((root.promy && root.promy.Promise) || root.Promise);
    return new Cons(executor, canceller);
  }

  /**
   *     spawn(generator): Promise< returned_value >
   *
   * XXX
   *
   *     spawn(function* () {
   *       try {
   *         var value1 = yield step1();
   *         var value2 = yield step2(value1);
   *         var value3 = yield step3(value2);
   *         var value4 = yield step4(value3);
   *         // Do something with value4
   *       } catch (e) {
   *         // Handle any error from step1 through step4
   *       }
   *     });
   */
  function spawn(generator) {
    var promise, cancelled;
    return newPromise(function (done, fail, notify) {
      var g = generator(), prev_value, next = {};
      function rec(method) {
        if (cancelled) { return; }
        try {
          next = g[method](prev_value);
        } catch (e) {
          return fail(e);
        }
        if (next.done) {
          return done(next.value);
        }
        promise = next.value;
        if (!promise || typeof promise.then !== "function") {
          // The value is not a thenable. However, the user used `yield`
          // anyway. It means he wants to left hand to another process.
          promise = newPromise(function (d) { d(promise); });
        }
        promise.then(function (a) {
          prev_value = a;
          rec("next");
        }, function (e) {
          prev_value = e;
          rec("throw");
        }, notify);
      }
      rec("next");
    }, function () {
      cancelled = true;
      if (promise && typeof promise.cancel === "function") {
        promise.cancel();
      }
    });
  }

  /*
   * If the global `promy` exists, then `promy.spawn` is added and if the global
   * `spawn` does not exist, it is also provided. Else, if the global `promy`
   * does not exist, then only the global `spawn` will be provided.
   */
  if (root.promy) {
    root.promy.spawn = spawn;
    if (root.spawn === undefined) {
      root.spawn = spawn;
    }
  } else {
    root.spawn = spawn;
  }

}(this));
