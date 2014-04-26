/*jslint indent: 2 */

(function factory(root) {
  "use strict";
  /*global setTimeout */

  /*
   * setImmediate.js
   *
   * Synchronous as possible setImmediate function
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

  var timers = {}, current = 1, next = 0;

  function justThrow(e) {
    throw e;
  }

  function runTimers() {
    while (timers.hasOwnProperty(current)) {
      if (timers[current]) {
        try {
          timers[current]();
        } catch (e) {
          // How to export to window.onerror and there listeners ?  Using
          // setTimeout will throw the error after all the timers.  Using
          // document.createEvent will also throw the error after all the
          // timers.
          setTimeout(justThrow, 0, e);
        }
      }
      delete timers[current];
      current += 1;
    }
    timers.running = false;
  }

  root.setImmediate = function (callback) {
    if (typeof callback !== "function") { return; }
    next += 1;
    var args;
    if (arguments.length === 1) {
      timers[next] = callback;
    } else {
      args = [].slice.call(arguments, 1);
      timers[next] = function () {
        return callback.apply(null, args);
      };
    }
    // console.log(JSON.stringify(timers, function (k, v) {
    //   if (typeof v === "function") {
    //     return v.name || "Function";
    //   }
    //   return v;
    // }));
    if (!timers.running) {
      timers.running = true;
      setTimeout(runTimers);
    }
    return next;
  };

  root.clearImmediate = function (ident) {
    if (timers.hasOwnProperty(ident)) {
      timers[ident] = undefined;
    }
  };

  /**
   * Prepare `toScript` function to export easily this library as a string.
   */
  Object.defineProperty(root.setImmediate, "toScript", {
    "configurable": true,
    "enumerable": false,
    "writable": true,
    "value": function () {
      return "(" + factory.toString() + "(this));";
    }
  });

}(this));
