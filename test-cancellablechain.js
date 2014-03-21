// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, stop, start, promy, setTimeout */

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

  module("promy.CancellableChain");

  test("then returns the CancellableChain", function () {
    var a, b;
    a = new promy.CancellableChain();
    b = a.then(function () {
      return;
    });

    ok(a === b);
  });

  test("should be fulfilled with the given value", function () {
    stop();
    var start = starter();

    new promy.CancellableChain(true).then(function (answer) {
      ok(answer === true);
      start();
    });

    setTimeout(start, 100);
  });

  test("cancel should cancel all remaining promises", 2, function () {
    stop();
    var start = starter();
    new promy.CancellableChain().then(null, function (error) {
      ok(error instanceof promy.CancelException, 'then 1');
    }).then(null, function (error) {
      ok(error instanceof promy.CancelException, 'then 2');
      start();
    }).cancel();

    setTimeout(start, 100);
  });

  test("can be converted to normal promise", function () {
    ok(new promy.CancellableChain().detach() instanceof promy.Promise);
  });

  test("cancel normal promise should cancel the chain", function () {
    stop();
    var start = starter();

    function doSomething() {
      return new promy.CancellableChain().
        then(null, function (error) {
          ok(error instanceof promy.CancelException, 'then 1');
          start();
        }).detach();
    }
    doSomething().cancel();

    setTimeout(start, 100);
  });

}());
