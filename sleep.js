/*
 * Sleep
 *
 * A cancellable Promise A+ tool to sleep asynchronous process.
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
   *     sleep(delay, [value]): promise< value >
   *
   * Produces a new promise which will resolve with `value` after `delay`
   * milliseconds.
   *
   * @param  {Number} delay The time to sleep.
   * @param  {Any} [value] The value to resolve.
   * @return {Promise} A new promise.
   */
  function sleep(delay, value) {
    var ident;
    return newPromise(function (resolve) {
      ident = setTimeout(resolve, delay, value);
    }, function () {
      clearTimeout(ident);
    });
  }

  /*
   * If the global `promy` exists, then `promy.sleep` is added and if the global
   * `sleep` does not exist, it is also provided. Else, if the global `promy`
   * does not exist, then only the global `sleep` will be provided.
   */
  if (root.promy) {
    root.promy.sleep = sleep;
    if (root.sleep === undefined) {
      root.sleep = sleep;
    }
  } else {
    root.sleep = sleep;
  }

}(this));
