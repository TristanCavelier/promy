// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, deepEqual, stop, start, Promise,
  setTimeout, clearTimeout, CancelException */

(function () {
  "use strict";

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

  module("Promise.all");

  test("should fulfill with 0 promise", 1, function () {
    stop();
    var start = starter(1000);

    Promise.all([]).then(function (answer) {
      deepEqual(answer, []);
      start();
    });
  });

  test("should fulfill with 3 promises", 1, function () {
    stop();
    var start = starter(1000);

    Promise.all([
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3)
    ]).then(function (answers) {
      deepEqual(answers, [1, 2, 3]);
      start();
    }, start);
  });

  test("should notify sub promises", 2, function () {
    stop();
    var start = starter(1000), results = [];

    Promise.all([
      Promise.notify(1, 4),
      Promise.notify(2, 5),
      Promise.notify(3, 6)
    ]).then(function (answers) {
      deepEqual(results, [1, 2, 3]);
      deepEqual(answers, [4, 5, 6]);
      start();
    }, start, function (notification) {
      results.push(notification);
    });
  });

  test("`reject` should cancel unresolved promises", 2, function () {
    stop();
    var start = starter(1000);

    function never() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }

    Promise.all([
      Promise.resolve(10),
      Promise.reject(15),
      never()
    ]).then(start, function (error) {
      ok(error === 15);
      start();
    });
  });

  test("`cancel` should cancel sub promises", 4, function () {
    stop();
    var start = starter(1000), p;

    function never() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }

    p = Promise.all([
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

}());
