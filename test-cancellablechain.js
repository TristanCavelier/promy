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

  module("CancellableChain");

  test("then returns the CancellableChain", function () {
    var a, b;
    a = new CancellableChain();
    b = a.then(function () {
      return;
    });

    ok(a === b);
  });

  test("should be fulfilled with the given value", function () {
    stop();
    var start = starter(1000);

    new CancellableChain(true).then(function (answer) {
      ok(answer === true);
      start();
    }, start);
  });

  test("cancel should cancel all remaining promises", 2, function () {
    stop();
    var start = starter(1000);
    new CancellableChain(true).then(function (answer) {
      ok(answer, "previous promise is resolved before cancel call.");
    }, function () {
      ok(false, "should not be rejected!");
    }).then(start, function (error) {
      ok(error instanceof CancelException, 'then 2');
      start();
    }).cancel();
  });

  test("cancel should cancel all promises", 3, function () {
    stop();
    var start = starter(1000);
    function never() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }
    new CancellableChain(never()).then(null, function (error) {
      ok(error instanceof CancelException, "then 1");
    }).then(start, function (error) {
      ok(error instanceof CancelException, 'then 2');
      start();
    }).cancel();
  });

  test("can be converted to normal promise", function () {
    ok(new CancellableChain().detach() instanceof Promise);
  });

  test("cancel normal promise should cancel the chain", 2, function () {
    stop();
    var start = starter(1000);
    function never() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }
    function doSomething() {
      return new CancellableChain(never()).
        then(start, function (error) {
          ok(error instanceof CancelException, 'then 1');
          start();
        }).detach();
    }
    doSomething().cancel();
  });

}());
