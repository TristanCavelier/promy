// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, stop, start,
  setTimeout, clearTimeout */

(function (root) {
  "use strict";

  var Promise = root.promy.Promise,
    globalPromy = root.promy,
    CancelException = root.promy.CancelException,
    spawn = root.promy.spawn;

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
      start();
    }, start);
    result.push("second");
  });

  test("should fulfills with returned promise fulfillment value", function () {
    stop();
    var start = starter(1000);
    spawn(function* () {
      return Promise.resolve().then(function () {
        return 2;
      });
    }).then(function (value) {
      ok(value === 2);
      start();
    }, start);
  });

  test("should rejects with returned promise rejected reason", function () {
    stop();
    var start = starter(1000);
    spawn(function* () {
      return Promise.resolve().then(function () {
        throw 2;
      });
    }).then(start, function (value) {
      ok(value === 2);
      start();
    });
  });

  test("should yield to another process", function () {
    stop();
    var start = starter(1000), result = [];
    function sleep(timeout, value) {
      return new Promise(function (done) {
        setTimeout(done, timeout, value);
      });
    }
    spawn(function* () {
      setTimeout(result.push.bind(result, 2))
      result.push(1);
      result.push(yield sleep(30, 3));
    }).then(function () {
      deepEqual(result, [1, 2, 3]);
      start();
    }, start);
  });

  test("rejected promise should be cought by try/catch", function () {
    stop();
    var start = starter(1000);
    spawn(function* () {
      try {
        yield Promise.reject(2);
      } catch (e) {
        return e;
      }
      return 0;
    }).then(function (value) {
      deepEqual(value, 2);
      start();
    }, start);
  });

  test("should cancel inner promise", 1, function () {
    stop();
    var start = starter(1000), r = Promise.resolve(), p, result = [];
    p = spawn(function* () {
      yield r.then(function () {
        return r.then(function () {
          setTimeout(p.cancel.bind(p));
          return new Promise(function () { return; }, function () {
            result.push("Cancelled");
          });
        });
      });
    });
    p.then(start, function (value) {
      result.push(value instanceof CancelException);
      deepEqual(result, ["Cancelled", true]);
      start();
    });
  });

}(this));
