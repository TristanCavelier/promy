// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, stop, start, spawn, CancelException,
  Promise, setTimeout */

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

  module("spawn");

  test("return should fulfill the promise", 1, function () {
    stop();
    var start = starter(100);
    spawn(function* () {
      return 2;
    }).then(function (value) {
      ok(value === 2);
      start();
    }, start);
  });

  test("throw should reject the promise", 1, function () {
    stop();
    var start = starter(100);
    spawn(function* () {
      throw 2;
    }).then(start, function (value) {
      ok(value === 2);
      start();
    });
  });

  test("check when callbacks are called", 1, function () {
    stop();
    var start = starter(100), result = [];
    spawn(function* () {
      result.push("first");
    }).then(function () {
      deepEqual(result, ["first", "second"]);
    }, start);
    result.push("second");
  });

  test("return a promise should wait for its fulfillment", function () {
    stop();
    var start = starter(100), result = [];
    spawn(function* () {
      result.push("first");
      return Promise.resolve().then(function () {
        result.push("third");
      });
    }).then(function () {
      deepEqual(result, ["first", "second", "third"]);
    }, start);
    result.push("second");
  });

  test("should fulfills with returned promise fulfillment value", function () {
    stop();
    var start = starter(100), result = [];
    spawn(function* () {
      return Promise.resolve().then(function () {
        return 2;
      });
    }).then(function (value) {
      ok(value === 2);
    }, start);
  });

  test("should rejects with returned promise rejected reason", function () {
    stop();
    var start = starter(100), result = [];
    spawn(function* () {
      return Promise.resolve().then(function () {
        throw 2;
      });
    }).then(start, function (value) {
      ok(value === 2);
      start();
    });
  });

}());
