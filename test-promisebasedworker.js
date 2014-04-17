// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, deepEqual, stop, start,
  setTimeout, clearTimeout */

(function (root) {
  "use strict";

  var globalPromy = root.promy,
    CancelException = root.promy.CancelException,
    worker = root.promy.worker;

  function starter(num) {
    var started = false, ident;
    function startFn() {
      if (!started) {
        started = true;
        clearTimeout(ident);
        start();
      }
    }
    if (num) {
      ident = setTimeout(startFn, num);
    }
    return startFn;
  }

  function tester(str, num, fun) {
    if (root.Promise !== root.promy.Promise) {
      test(str + " (no promy)", num, function () {
        delete root.promy;
        fun();
      });
    }
    test(str, num, function () {
      root.promy = globalPromy;
      fun();
    });
  }

  module("worker");

  tester("resolve (script is string)", 1, function () {
    stop();
    var start = starter(1000);
    worker(
      "onmessage = function () {" +
        "resolve(\"Hi\");" +
        "};"
    )().then(function (data) {
      deepEqual(data, "Hi");
      start();
    }, start);
  });

  tester("resolve (script is function)", 1, function () {
    stop();
    var start = starter(1000);
    worker(function () {
      /*global resolve */
      resolve("Hi");
    })().then(function (data) {
      deepEqual(data, "Hi");
      start();
    }, start);
  });

  tester("reject", 1, function () {
    stop();
    var start = starter(1000);
    worker(function () {
      /*global reject */
      reject("Bye");
    })().then(start, function (data) {
      deepEqual(data, "Bye");
      start();
    });
  });

  test("notify and resolve", 1, function () {
    stop();
    var start = starter(1000), results = [];
    worker(function () {
      /*global notify, resolve */
      notify("Hello");
      resolve("world");
    })().then(function (data) {
      results.push(data);
      deepEqual(results, ["Hello", "world"]);
      start();
    }, start, function (notif) {
      results.push(notif);
    });
  });

  tester("throws an error", 1, function () {
    stop();
    var start = starter(1000);
    /*global window */
    window.onerror = null; // avoid QUnit to throw
    // we can't avoid to propagate the error to window.onerror
    // on Chrome.
    worker(function () {
      throw new TypeError("Hello");
    })().then(start, function (reason) {
      ok(reason.indexOf("TypeError: Hello") !== -1);
      start();
    });
  });

  tester("passing parameter", 1, function () {
    stop();
    var start = starter(1000);
    worker(function (event) {
      /*global resolve */
      resolve(event.data + 1);
    })(1).then(function (data) {
      deepEqual(data, 2);
      start();
    }, start);
  });

  test("cancel", 1, function () {
    stop();
    var start = starter(1000), p;
    p = worker(function () {
      setTimeout(function () {
        resolve("Boo");
      }, 100);
    })();
    p.then(start, function (reason) {
      ok(reason instanceof CancelException);
      start();
    });
    setTimeout(function () {
      p.cancel();
    }, 10);
  });

}(this));
