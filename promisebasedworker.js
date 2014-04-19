/*
 * Promise based Worker
 *
 * A cancellable and notification propagation Promise A+ tool to do something in
 * background.
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
/*global window, Blob, Worker */

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

  /*global postMessage */
  function resolve(value) {
    postMessage({
      "command": "resolve",
      "value": value
    });
  }

  function reject(value) {
    postMessage({
      "command": "reject",
      "value": value
    });
  }

  function notify(value) {
    postMessage({
      "command": "notify",
      "value": value
    });
  }

  var onerror = function (error) {
    reject(error);
    error.preventDefault();
  }, header = resolve.toString() + "\n" +
    reject.toString() + "\n" +
    notify.toString() + "\n" +
    "onerror = " + onerror.toString() + ";\n";

  /**
   *     worker(script) : task
   *
   * Produces a function `task` which is able to execute a `script` in a web
   * worker. Each time the `task` is launched, a new web worker is created and
   * executed.
   *
   * `task` can take one serializable parameter which will be the `onmessage`
   * event data in the web worker.
   *
   * `script` can be a function or a string. If the script is a string, then it
   * should contains an assignement to the global `onmessage` listener.
   * Otherwise, the `script` function will be automatically assigned to
   * `onmessage`.
   *
   *     var task = worker(function (event) {
   *       /\*global resolve, reject, notify *\/
   *       notify(event.data + 1);
   *       notify(event.data + 2);
   *       resolve(event.data + 3);
   *     });
   *     task(3).then(console.log, console.warn, console.info);
   *     // (i)> 4
   *     // (i)> 5
   *     //    > 6
   *
   * @param  {Function|String} script The script to run in the web worker.
   * @return {Function} The worker function.
   */
  function worker(script) {
    if (typeof script === "function") {
      script = "onmessage = " + script.toString() + ";";
    }
    script = window.URL.createObjectURL(new Blob([
      header + script
    ], {"type": "application/javascript"}));
    // script = "data:application/javascript," + encodeURIComponent(
    //   header + script
    // );
    return function (data) {
      var w = new Worker(script);
      return newPromise(function (done, fail, notify) {
        w.onmessage = function (event) {
          if (typeof event.data === "object" && event.data !== null) {
            switch (event.data.command) {
            case "resolve":
              done(event.data.value);
              w.terminate();
              return;
            case "reject":
              fail(event.data.value);
              w.terminate();
              return;
            case "notify":
              if (typeof notify === "function") {
                notify(event.data.value);
              }
              return;
            }
          }
        };
        w.onerror = function (event) {
          fail(event);
          w.terminate();
        };
        w.postMessage(data);
      }, function () {
        w.terminate();
      });
    };
  }

  /*
   * If the global `promy` exists, then `promy.worker` is added and if the
   * global `worker` does not exist, it is also provided. Else, if the global
   * `promy` does not exist, then only the global `worker` will be provided.
   */
  if (root.promy) {
    root.promy.worker = worker;
    if (root.worker === undefined) {
      root.worker = worker;
    }
  } else {
    root.worker = worker;
  }

}(this));
