/*jslint indent: 2, plusplus: true */
/*global module, test, ok, deepEqual, stop, start, Promise, CancelException,
  setTimeout, clearTimeout */

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

  test("should notify during operation", function () {
    stop();
    var results = [];

    Promise.notify(true).
      then(Promise.notify.bind(null, 10), null, function (value) {
        results.push(value);
        return "string";
      }).
      then(function () {
        deepEqual(results, [true, "string", 10]);
        start();
      }, null, function (value) {
        results.push(value);
      }).
      catch(function () {
        ok(false, "Error should not occur!");
        start();
      });
  });

  test("should notify and propagate fulfillment value", function () {
    stop();
    var results = [];

    Promise.resolve(true).
      then(Promise.notify.bind(null, 10)).
      then(function (answer) {
        results.push(answer);
        deepEqual(results, [10, true]);
        start();
      }, null, function (value) {
        results.push(value);
      }).
      catch(function () {
        ok(false, "Error should not occur!");
        start();
      });
  });

  module("Promise Cancellations");

  test("cancel should cancel selected promise only", 1, function () {
    stop();
    var start = starter(100), p = new Promise(function (resolve) {
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
  });

  test("should cancels itself", 1, function () {
    stop();
    var start = starter(100), p = new Promise(function (resolve) {
      resolve();
    }).then(function () {
      p.cancel();
      return true;
    }, function () {
      ok(false, "Should neven happen!");
    });
    p.then(null, function (error) {
      ok(error instanceof CancelException, 'then 2');
      start();
    });
  });

  test("should cancels once", 1, function () {
    stop();
    new Promise(function () { return; }, function () {
      ok(true, "Cancelled");
    }).cancel().cancel();

    setTimeout(start, 50);
  });

}());
