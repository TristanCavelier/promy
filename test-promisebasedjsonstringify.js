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

  var jsonStringify = root.promy.jsonStringify;

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

  module("jsonStringify");

  test("check when callbacks are called", 1, function () {
    stop();
    var start = starter(1000), results = [],
      o = {"a": "b", "c": ["y"], "d": {"e": "f"}};

    jsonStringify(o).then(function () {
      deepEqual(results, ["first"]);
      start();
    }, function (err) {
      ok(false, err);
      start();
    });
    results.push("first");
  });

  test("check result", 1, function () {
    stop();
    var start = starter(1000), o = {"a": "b", "c": ["y"], "d": {"e": "f"}};

    jsonStringify(o).then(function (res) {
      deepEqual(res, JSON.stringify(o));
      start();
    }, function (err) {
      ok(false, err);
      start();
    });
  });

  test("check result (parralel)", 1, function () {
    stop();
    var start = starter(1000), o = {"a": "b", "c": ["y"], "d": {"e": "f"}};

    jsonStringify(o, {"parallel": true}).then(function (res) {
      deepEqual(res, JSON.stringify(o));
      start();
    }, function (err) {
      ok(false, err);
      start();
    });
  });

  // test("check when callbacks are called with replacer", 1, function () {
  //   stop();
  // var start = starter(), results = [], o = {"a":"b","c":["y"],"d":{"e":"f"}};

  //   jsonStringify(o, function () {

  //   }).then(function (res) {
  //     results.push(res);
  //     deepEqual(results, ["first", JSON.stringify(o)]);
  //     start();
  //   }, function (err) {
  //     console.log(err);
  //     ok(false, err);
  //     start();
  //   });
  //   results.push("first");

  //   setTimeout(start, 500);
  // });

  // test("check when callbacks are called with promises", 1, function () {
  //   stop();
  //   var start = starter(), results = [];

  //   forEach([0, 2, 4, 6], function (index) {
  //     results.push(index);
  //     return Promise.resolve(index + 1).then(function (index) {
  //       results.push(index);
  //     });
  //   }).then(function () {
  //     deepEqual(results, [0, 1, 2, 3, 4, 5, 6, 7]);
  //     start();
  //   });

  //   setTimeout(start, 200);
  // });

  // test("should notify the sub promises notifications", 1, function () {
  //   stop();
  //   var start = starter(), results = [], array = [0, 2, 4, 6];

  //   forEach(array, Promise.notify).then(function () {
  //     deepEqual(results, [0, 2, 4, 6]);
  //     start();
  //   }, null, function (event) {
  //     results.push(event);
  //   });

  //   setTimeout(start, 200);
  // });

  // test("error should stop iteration", 3, function () {
  //   stop();
  //   var start = starter(), p, results = [true];

  //   p = forEach([0, 2, 4, 6], function () {
  //     ok(results.shift());
  //     throw new TypeError("HEY");
  //   });

  //   p.then(function () {
  //     ok(false, "should not be fulfilled");
  //     start();
  //   }, function (error) {
  //     deepEqual(error.name, "TypeError");
  //     deepEqual(error.message, "HEY");
  //     start();
  //   });

  //   setTimeout(start, 200);
  // });

  // test("rejected inner promise should stop iteration", 3, function () {
  //   stop();
  //   var start = starter(), p, results = [true];

  //   p = forEach([0, 2, 4, 6], function () {
  //     ok(results.shift());
  //     return Promise.reject(new TypeError("HEY"));
  //   });

  //   p.then(function () {
  //     ok(false, "should not be fulfilled");
  //     start();
  //   }, function (error) {
  //     deepEqual(error.name, "TypeError");
  //     deepEqual(error.message, "HEY");
  //     start();
  //   });

  //   setTimeout(start, 200);
  // });

  // test("cancel should stop iteration", 2, function () {
  //   stop();
  //   var start = starter(), p, results = [true];

  //   function never() {
  //     return new Promise(function () { return; });
  //   }

  //   p = forEach([0, 2, 4, 6], function () {
  //     ok(results.shift());
  //     setTimeout(p.cancel.bind(p));
  //     return never();
  //   });

  //   p.then(function () {
  //     ok(false, "should not be fulfilled");
  //     start();
  //   }, function (error) {
  //     ok(error instanceof CancelException);
  //     start();
  //   });

  //   setTimeout(start, 200);
  // });

  // test("should cancel inner promise", 2, function () {
  //   stop();
  //   var start = starter(), p;

  //   function cancellableThing() {
  //     return new Promise(function () { return; }, function () {
  //       ok(true, "Cancelled");
  //     });
  //   }

  //   p = forEach([0, 2, 4, 6], function () {
  //     setTimeout(p.cancel.bind(p));
  //     return cancellableThing();
  //   });

  //   p.then(function () {
  //     ok(false, "should not be fulfilled");
  //     start();
  //   }, function (error) {
  //     ok(error instanceof CancelException);
  //     start();
  //   });

  //   setTimeout(start, 200);
  // });

}(this));
