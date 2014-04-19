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
    CancelException = root.promy.CancelException,
    reduce = root.promy.reduce;

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

  module("reduce");

  tester("check when callbacks are called without promises", 1, function () {
    stop();
    var start = starter(1000), results = [], array = [0, 2, 4];

    reduce(array, function (previous, current) {
      previous.push(current);
      return previous;
    }, results).then(function (results) {
      deepEqual(results, ["first", 0, 2, 4]);
      start();
    });
    results.push("first");
  });

  tester("check when callbacks are called with promises", 1, function () {
    stop();
    var start = starter(1000);

    reduce([2, 4, 6], function (previous, current) {
      return Promise.resolve().then(function () {
        return previous * current;
      });
    }).then(function (result) {
      deepEqual(result, 48); // 2 * 4 * 6
      start();
    });
  });

  test("should notify the sub promises notifications", 1, function () {
    stop();
    var start = starter(1000), results = [], array = [0, 2, 4, 6];

    reduce(array, function (previous, current) {
      /*jslint unparam: true */
      return Promise.notify(current);
    }, null).then(function () {
      deepEqual(results, [0, 2, 4, 6]);
      start();
    }, null, function (event) {
      results.push(event);
    });
  });

  tester("error should stop iteration", 3, function () {
    stop();
    var start = starter(1000), p, results = [true];

    p = reduce([0, 2, 4, 6], function () {
      ok(results.shift());
      throw new TypeError("HEY");
    });

    p.then(function () {
      ok(false, "should not be fulfilled");
      start();
    }, function (error) {
      deepEqual(error.name, "TypeError");
      deepEqual(error.message, "HEY");
      start();
    });
  });

  tester("rejected inner promise should stop iteration", 3, function () {
    stop();
    var start = starter(1000), p, results = [true];

    p = reduce([0, 2, 4, 6], function () {
      ok(results.shift());
      return Promise.reject(new TypeError("HEY"));
    });

    p.then(function () {
      ok(false, "should not be fulfilled");
      start();
    }, function (error) {
      deepEqual(error.name, "TypeError");
      deepEqual(error.message, "HEY");
      start();
    });
  });

  test("cancel should stop iteration", 2, function () {
    stop();
    var start = starter(1000), p, results = [true];

    function never() {
      return new Promise(function () { return; });
    }

    p = reduce([0, 2, 4, 6], function () {
      ok(results.shift());
      setTimeout(p.cancel.bind(p));
      return never();
    });

    p.then(function () {
      ok(false, "should not be fulfilled");
      start();
    }, function (error) {
      ok(error instanceof CancelException);
      start();
    });
  });

  test("should cancel inner promise", 2, function () {
    stop();
    var start = starter(1000), p;

    function cancellableThing() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }

    p = reduce([0, 2, 4, 6], function () {
      setTimeout(p.cancel.bind(p));
      return cancellableThing();
    });

    p.then(function () {
      ok(false, "should not be fulfilled");
      start();
    }, function (error) {
      ok(error instanceof CancelException);
      start();
    });
  });

  test("check results with an array of length 1", 1, function () {
    stop();
    var start = starter(1000), results = [], array = ["e"];

    reduce(array, function (previous, current) {
      previous.push(current);
      return previous;
    }, results).then(function (results) {
      deepEqual(results, ["e"]);
      start();
    });
  });

}(this));
