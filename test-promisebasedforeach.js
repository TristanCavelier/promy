// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, deepEqual, stop, start, Promise, forEach,
  setTimeout, CancelException */

(function () {
  "use strict";

  function starter() {
    var started = false;
    return function () {
      if (!started) {
        started = true;
        start();
      }
    };
  }

  module("forEach");

  test("check when callbacks are called without promises", 1, function () {
    stop();
    var start = starter(), results = [], array = [0, 2, 4];

    forEach(array, function (value, index, array) {
      results.push(value, index, array);
    }).then(function () {
      deepEqual(results, ["first", 0, 0, array, 2, 1, array, 4, 2, array]);
      start();
    });
    results.push("first");

    setTimeout(start, 200);
  });

  test("check when callbacks are called with promises", 1, function () {
    stop();
    var start = starter(), results = [];

    forEach([0, 2, 4, 6], function (index) {
      results.push(index);
      return Promise.resolve(index + 1).then(function (index) {
        results.push(index);
      });
    }).then(function () {
      deepEqual(results, [0, 1, 2, 3, 4, 5, 6, 7]);
      start();
    });

    setTimeout(start, 200);
  });

  test("should notify the sub promises notifications", 1, function () {
    stop();
    var start = starter(), results = [], array = [0, 2, 4, 6];

    forEach(array, Promise.notify).then(function () {
      deepEqual(results, [0, 2, 4, 6]);
      start();
    }, null, function (event) {
      results.push(event);
    });

    setTimeout(start, 200);
  });

  test("error should stop iteration", 3, function () {
    stop();
    var start = starter(), p, results = [true];

    p = forEach([0, 2, 4, 6], function () {
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

    setTimeout(start, 200);
  });

  test("rejected inner promise should stop iteration", 3, function () {
    stop();
    var start = starter(), p, results = [true];

    p = forEach([0, 2, 4, 6], function () {
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

    setTimeout(start, 200);
  });

  test("cancel should stop iteration", 2, function () {
    stop();
    var start = starter(), p, results = [true];

    function never() {
      return new Promise(function () { return; });
    }

    p = forEach([0, 2, 4, 6], function () {
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

    setTimeout(start, 200);
  });

  test("should cancel inner promise", 2, function () {
    stop();
    var start = starter(), p;

    function cancellableThing() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }

    p = forEach([0, 2, 4, 6], function () {
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

    setTimeout(start, 200);
  });

}());
