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

  var Promise = root.promy.Promise,
    globalPromy = root.promy,
    CancelException = root.promy.CancelException;

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
        Promise = root.Promise;
        delete root.promy;
        fun();
      });
    }
    test(str, num, function () {
      Promise = globalPromy.Promise;
      root.promy = globalPromy;
      fun();
    });
  }

  module("Promise.race");

  tester("should never fulfill with 0 promise", 0, function () {
    stop();
    var start = starter(1000);

    Promise.race([]).then(function (answer) {
      deepEqual(answer, !answer);
      start();
    });
  });

  tester("should fulfill with 3 promises", 1, function () {
    stop();
    var start = starter(1000);

    Promise.race([
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3)
    ]).then(function (answer) {
      deepEqual(answer, 1);
      start();
    }, start);
  });

  tester("should reject with 1 rejected promise", 1, function () {
    stop();
    var start = starter(1000);

    function never() {
      return new Promise(function () { return; });
    }

    Promise.race([
      never(),
      Promise.reject(2),
      never()
    ]).then(start, function (answer) {
      deepEqual(answer, 2);
      start();
    });
  });

  test("should notify sub promises", 2, function () {
    stop();
    var start = starter(1000), results = [];

    Promise.race([
      Promise.notify(1, 4),
      Promise.notify(2, 5),
      Promise.notify(3, 6)
    ]).then(function (answer) {
      deepEqual(results, [1, 2, 3]);
      deepEqual(answer, 4);
      start();
    }, start, function (notification) {
      results.push(notification);
    });
  });

  test("resloved promise should cancel unresolved promises", 1, function () {
    stop();
    var start = starter(1000), results = [];

    function never() {
      return new Promise(function () { return; }, function () {
        results.push("cancelled");
      });
    }

    Promise.race([
      never(),
      Promise.resolve(10),
      never()
    ]).then(function (error) {
      results.push(error);
      deepEqual(results, ["cancelled", "cancelled", 10]);
      start();
    }, start);
  });

  test("`cancel` should cancel sub promises", 4, function () {
    stop();
    var start = starter(1000), p;

    function never() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }

    p = Promise.race([
      never(),
      never(),
      never()
    ]);
    p.then(start, function (error) {
      ok(error instanceof CancelException);
      start();
    });
    p.cancel();
  });

}(this));
