/*
 * First Fulfilled
 *
 * A cancellable and notification propagation Promise A+ tool to get the first
 * fulfilled promise from a list of promises.
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
   *     firstFulfilled(promises): promises< last_fulfilment_value >
   *
   * Responds with the first resolved promise answer recieved. If all promises
   * are rejected, it returns the last rejected promise answer
   * received. Promises are cancelled only by calling
   * `firstFulfilled(promises).cancel()`.
   *
   * @param  {Array} promises An array of promises
   * @return {Promise} A new promise
   */
  function firstFulfilled(promises) {
    var length = promises.length;

    function onCancel() {
      var i, l, promise;
      for (i = 0, l = promises.length; i < l; i += 1) {
        promise = promises[i];
        if (typeof promise.cancel === "function") {
          promise.cancel();
        }
      }
    }

    return newPromise(function (resolve, reject, notify) {
      var i, count = 0;
      function resolver(answer) {
        resolve(answer);
        onCancel();
      }

      function rejecter(answer) {
        count += 1;
        if (count === length) {
          return reject(answer);
        }
      }

      for (i = 0; i < length; i += 1) {
        promises[i].then(resolver, rejecter, notify);
      }
    }, onCancel);
  }

  /*
   * If the global `promy` exists, then `promy.firstFulfilled` is added and if
   * the global `firstFulfilled` does not exist, it is also provided. Else, if
   * the global `promy` does not exist, then only the global `firstFulfilled`
   * will be provided.
   */
  if (root.promy) {
    root.promy.firstFulfilled = firstFulfilled;
    if (root.firstFulfilled === undefined) {
      root.firstFulfilled = firstFulfilled;
    }
  } else {
    root.firstFulfilled = firstFulfilled;
  }

}(this));
