// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, deepEqual, stop, start, promy,
  setTimeout, clearTimeout */

(function (root) {
  "use strict";

  var Promise = promy.Promise,
    CancelException = promy.CancelException,
    range = promy.range;

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
    if (root.Promise !== promy.Promise) {
      test(str + " (no promy)", num, function () {
        Promise = root.Promise;
        fun();
      });
    }
    test(str, num, function () {
      Promise = promy.Promise;
      fun();
    });
  }

  module("range");

  tester("check when callbacks are called without promises", 1, function () {
    stop();
    var start = starter(1000), results = [];

    range(3, 0, -2, function (index) {
      results.push(index);
    }).then(function () {
      deepEqual(results, ["first", 3, 1]);
      start();
    }, start);
    results.push("first");
  });

  tester("check when callbacks are called with promises", 1, function () {
    stop();
    var start = starter(1000), results = [];

    range(3, 0, -2, function (index) {
      results.push(index);
      return Promise.resolve(index + 1).then(function (index) {
        results.push(index);
      });
    }).then(function () {
      deepEqual(results, [3, 4, 1, 2]);
      start();
    }, start);
  });

  tester("should notify the sub promises notifications", 1, function () {
    stop();
    var start = starter(1000), results = [];

    range(3, promy.Promise.notify).then(function () {
      deepEqual(results, [0, 1, 2]);
      start();
    }, start, function (value) {
      results.push(value);
    });
  });

  tester("error should stop iteration", 3, function () {
    stop();
    var start = starter(1000), p, results = [true];

    p = range(3, function () {
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

    p = range(3, function () {
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

  tester("cancel should stop iteration", 2, function () {
    stop();
    var start = starter(1000), p, results = [true];

    function never() {
      return new Promise(function () { return; });
    }

    p = range(3, function () {
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

    p = range(3, function () {
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

}(this));
