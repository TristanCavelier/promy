// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, stop, start, promy,
  setTimeout */

(function () {
  "use strict";

  var Promise = promy.Promise,
    CancelException = promy.CancelException,
    CancellableChain = promy.CancellableChain;

  function starter() {
    var started = false;
    return function () {
      if (!started) {
        started = true;
        start();
      }
    };
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
    var start = starter();

    new CancellableChain(true).then(function (answer) {
      ok(answer === true);
      start();
    });

    setTimeout(start, 100);
  });

  test("cancel should cancel all remaining promises", 2, function () {
    stop();
    var start = starter();
    new CancellableChain(true).then(function (answer) {
      ok(answer, "previous promise is resolved before cancel call.");
    }, function () {
      ok(false, "should not be rejected!");
    }).then(null, function (error) {
      ok(error instanceof CancelException, 'then 2');
      start();
    }).cancel();

    setTimeout(start, 100);
  });

  test("cancel should cancel all promises", 3, function () {
    stop();
    var start = starter();
    function never() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }
    new CancellableChain(never()).then(null, function (error) {
      ok(error instanceof CancelException, "then 1");
    }).then(null, function (error) {
      ok(error instanceof CancelException, 'then 2');
      start();
    }).cancel();

    setTimeout(start, 100);
  });

  test("can be converted to normal promise", function () {
    ok(new CancellableChain().detach() instanceof Promise);
  });

  test("cancel normal promise should cancel the chain", 2, function () {
    stop();
    var start = starter();
    function never() {
      return new Promise(function () { return; }, function () {
        ok(true, "Cancelled");
      });
    }
    function doSomething() {
      return new CancellableChain(never()).
        then(null, function (error) {
          ok(error instanceof CancelException, 'then 1');
          start();
        }).detach();
    }
    doSomething().cancel();

    setTimeout(start, 100);
  });

}());
