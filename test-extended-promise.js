/*jslint indent: 2, plusplus: true */
/*global module, test, ok, deepEqual, stop, start, Promise, CancelException,
  setTimeout, clearTimeout */

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


  module("Promise Notifications");

  test("should get notified before resolve", function () {
    stop();

    var results = [];

    new Promise(function (resolve, reject, notify) {
      /*jslint unparam: true */
      notify(1);
      notify(2);
      resolve(3);
    }).then(function (value) {
      results.push(value);
      deepEqual(results[0], 1, "Notified");
      deepEqual(results[1], 2, "Notified");
      deepEqual(results[2], 3, "Fulfilled");
      deepEqual(results.length, 3, "OK");
      start();
    }, null, function (notification) {
      results.push(notification);
    });
  });

  test("should get notified from a then", function () {
    stop();

    var results = [];

    Promise.resolve().then(function () {
      return new Promise(function (resolve, reject, notify) {
        /*jslint unparam: true */
        notify(1);
        notify(2);
        resolve(3);
      });
    }).then(function (value) {
      results.push(value);
      deepEqual(results[0], 1, "Notified");
      deepEqual(results[1], 2, "Notified");
      deepEqual(results[2], 3, "Fulfilled");
      deepEqual(results.length, 3, "OK");
      start();
    }, null, function (notification) {
      results.push(notification);
    });
  });


  module("Promise Cancellations");

  test("cancel should cancel selected promise only", 1, function () {
    stop();
    var start = starter(), p = new Promise(function (resolve) {
      resolve(true);
    }).then(null, function (error) {
      if (error instanceof CancelException) {
        ok(false, "then 1: Received a CancelException, " +
           "but should not be cancelled!");
      } else {
        ok(false, "then 1: Should not be cancelled!");
      }
    });
    p.then(null, function (error) {
      ok(error instanceof CancelException, 'then 2');
      start();
    });
    p.cancel();

    setTimeout(start, 100);
  });

}());
