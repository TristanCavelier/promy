promy
=====

A Promise A+ compatible library with cancellation and notification

File: `promy.js`

Version: v1.0.0

Provides the global `promy` with:

- [`Promise`](#promise)
- [`Promise.resolve`](#promiseresolve)
- [`Promise.reject`](#promisereject--rejected)
- [`Promise.fulfill`](#promisefulfill--fulfilled)
- [`Promise.notify`](#promisenotify)
- [`Promise.all`](#promiseall)
- [`Promise.race`](#promiserace)
- [`CancelException`](#cancelexception)
- [`fulfilled`](#promisefulfill--fulfilled)
- [`rejected`](#promisereject--rejected)
- [`pending`](#pending)

and all of them as globals if the corresponding globals do not already exist.

This repository provides also some [tools](#promise-tools):

- [`Promise based forEach`](#promise-based-foreach)
- [`range`](#range)


Promise
-------

This promise implementation is Promise A+ compatible. Instances of this promise
are *thenable*, it means it contains a `then` method which can be used by all
promises mechanism. Here, the `then` method is extended to manage notifications.

Instances of this promise are also *cancellable*, it means that a `cancel`
method can be used to cancel the promise operation.

API:

    new Promise(executor[, canceller])

Param:

- `{Function} executor` The function to solve the promise
- `{Function} [canceller]` The function to call on cancel

Methods:

- `promise.then([[[onFulfill], onReject], onNotify])`
- `promise.catch(onReject)`
- `promise.progress(onNotify)`
- `promise.cancel()`

For examples and informations about Promise A+, see
<http://www.html5rocks.com/en/tutorials/es6/promises/>.

Notification propagation mechanism:

    doSomething().then(null, null, function (notification) {
      // this function can be called several times

      return notification; // propagate notification
      // or
      throw null; // stop propagation
    });

Examples of notifications + cancellation:

    function getMyFile() {
      var xhr = new XMLHttpRequest();
      return new Promise(function (resolve, reject, notify) {
        xhr.onload = resolve;
        xhr.onerror = reject;
        xhr.onabort = reject;
        xhr.onprogress = notify;
        xhr.open("GET", "http://my.domain.com/url", true);
        xhr.send();
      }, function () {
        xhr.abort();
      });
    }

    var p = getMyFile();

    // you can log the load event with console.log
    // the error event with console.error
    // and the progress events with console.info

    p.then(console.log, console.error, console.info);

    // if you want to cancel the operation:

    p.cancel();

    // this will reject the promise with new CancelException("Cancelled")
    // as rejected reason


Promise.resolve()
-----------------

    Promise.resolve(value): Promise< value >

If `value` is not a promise, it creates a new promise and resolve with
`value`. Else it returns the `value`.


Promise.reject() / rejected()
-----------------------------

    Promise.reject(reason): Promise< reason >

Creates a new promise and rejects it with `reason`. For consistency and
debugging, the reason should be an instance of `Error`. If `reason` is a
promise, its resolved value will be the new promise rejected reason.


Promise.fulfill() / fulfilled()
-------------------------------

    Promise.fulfill(value): Promise< value >

Creates a new promise and fulfill it with `value`. If `value` is a promise, its
resolved value will be the new promise fulfillment value.


Promise.notify()
----------------

    Promise.notify(notification[, answer]): Promise< answer >

Creates a new promise which notifies with `notification` and resolve with
`answer`.

Promise.all()
-------------

    all(promises): Promise< promises_fulfilment_values >
    all(promises): Promise< one_rejected_reason >

Produces a promise that is resolved when all the given `promises` are
fulfilled. The fulfillment value is an array of each of the fulfillment values
of the promise array.

If one of the promises is rejected, the `all` promise will be rejected with the
same rejected reason, and the remaining unresolved promises will be cancelled.


Promise.race()
--------------

    race(promises): promise< first_value >

Produces a promise that is fulfilled when any one of the given promises is
fulfilled. As soon as one of the promises is resolved, whether by being
fulfilled or rejected, all the other promises are cancelled.


CancelException
---------------

The Exception raised when a promise is cancelled.


pending()
---------

    pending(): Promise

Returns a defer object of a new pending promise. This object provides the
`promise` property which is the new promise, and also provides `fulfill`,
`reject` and `notify` methods to resolve the promise. `canceller` is executed on
cancel if this property is defined.


Promise Tools
=============

Promise based forEach
---------------------

A cancellable and notification propagation Promise A+ tool to iterate an array.

File: `promisebasedforeach.js`

Version: v1.0.1

If the global `promy` exists, then `promy.forEach` is added and if the global
`forEach` does not exist, it is also provided. Else, if the global `promy` does
not exist, then only the global `forEach` will be provided.

It uses by default `promy.Promise` as promise mechanism. If `promy` is not
provided, then the global `Promise` will be used instead.

API:

    forEach(array, callback[, thisArg]): Promise

Param:

- `{Array} array` The array to parse
- `{Function} callback` Function to execute for each element.
- `{Any} [thisArg]` Value to use as `this` when executing `callback`.

Returns:

- `{Promise}` A new promise with no fulfillment value.

It executes the provided `callback` once for each element of the array with
an assigned value asynchronously. If the `callback` returns a promise, then
the function will wait for its fulfillment before executing the next
iteration.

`callback` is invoked with three arguments:

- the element value
- the element index
- the array being traversed

If a `thisArg` parameter is provided to `forEach`, it will be passed to
`callback` when invoked, for use as its `this` value.  Otherwise, the value
`undefined` will be passed for use as its `this` value.

Unlike `Array.prototype.forEach`, you can stop the iteration by throwing
something, or by doing a `cancel` to the returned promise if it is
cancellable promise.

Inspired by [`Array.prototype.forEach`][forEach()] from Mozilla Developer Network.

[forEach()]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach

    forEach(["a", "b", "c"], function (value, index, array) {
      return ajaxPostValueSomewhere(value);
    }).then(onDone, onError, onNotify);


range()
-------

A cancellable and notification propagation Promise A+ tool to iterate a range.

File: `range.js`

Version: v1.0.0

If the global `promy` exists, then `promy.range` is added and if the global
`range` does not exist, it is also provided. Else, if the global `promy` does
not exist, then only the global `range` will be provided.

It uses by default `promy.Promise` as promise mechanism. If `promy` is not
provided, then the global `Promise` will be used instead.

API:

    range(stop, callback): Promise
    range(start, stop[, step], callback): Promise

Param:

- `{Number} [start=0]` The start index
- `{Number} stop` The stop index
- `{Number} [step=1]` One step
- `{Function} callback` Function to execute on each iteration.

Returns:

- `{Promise}` A new promise with no fulfillment value.

It executes the provided `callback` once for each step between `start` and
`stop`. If the `callback` returns a promise, then the function will wait
for its fulfillment before executing the next iteration.

`callback` is invoked with one argument:

- the index of the step

`start`, `stop` and `step` must be finite numbers. If `step` is not
provided, then the default step will be `1`. If `start` and `step` are not
provided, `start` will be `0` and `step` will be `1`.

Inspired by [`range()`][range()] from Python 3 built-in functions.

[range()]: http://docs.python.org/3.4/library/functions.html#func-range

    range(10, function (index) {
      return notifyIndex(index);
    }).then(onDone, onError, onNotify);


License
=======

> Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>

> This program is free software. It comes without any warranty, to
> the extent permitted by applicable law. You can redistribute it
> and/or modify it under the terms of the Do What The Fuck You Want
> To Public License, Version 2, as published by Sam Hocevar. See
> the COPYING file for more details.
