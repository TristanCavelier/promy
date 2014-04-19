// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, stop, start, promy,
  setTimeout, clearTimeout */

(function () {
  "use strict";

  var Promise = promy.Promise,
    CancelException = promy.CancelException,
    CancellableChain = promy.CancellableChain;

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

  function assert() {
    ok(false, "assertion");
  }

  module("CancellableChain");

  test("then returns a CancellableChain", function () {
    var a = (new CancellableChain()).then(function () { return; });
    ok(a instanceof CancellableChain);
  });

  test("should be fulfilled with the given value", function () {
    stop();
    var start = starter(1000);

    new CancellableChain(true).then(function (answer) {
      ok(answer === true);
      start();
    }, start);
  });

  test("should cancel all previous chained promises", 3, function () {
    stop();
    var start = starter(1000), p;
    function never() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }
    p = new CancellableChain(never()).then(assert, assert);
    p.then(start, function (e) {
      ok(e instanceof CancelException);
    });
    p = p.then(assert, assert);
    p.then(start, function (e) {
      ok(e instanceof CancelException);
      start();
    });
    p.cancel();
  });

  test("can be converted to normal promise", function () {
    ok(new CancellableChain().detach() instanceof Promise);
  });

  test("cancel normal promise should cancel the chain", 2, function () {
    stop();
    var start = starter(1000), p;
    function never() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }
    function doSomething() {
      return new CancellableChain(never()).
        then(assert, assert).
        detach();
    }
    p = doSomething();
    p.then(start, function (e) {
      ok(e instanceof CancelException);
      start();
    });
    p.cancel();
  });

}());
