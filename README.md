promy
=====

A Promise A+ compatible library with cancellation and notification

File: `promy.js`

Version: v1.3.2 - [License: WTFPLv2](#license)

Provides the global `promy` with:

- [`Promise`](#promise)
- [`Promise.cast`](#promisecast)
- [`Promise.resolve`](#promiseresolve)
- [`Promise.reject`](#promisereject)
- [`Promise.fulfill`](#promisefulfill) (*non standard*)
- [`Promise.notify`](#promisenotify) (*non standard*)
- [`Promise.all`](#promiseall)
- [`Promise.race`](#promiserace)
- [`CancelException`](#cancelexception) (*non standard*)
- [`fulfilled`](#fulfilled) (*non standard*)
- [`rejected`](#rejected) (*non standard*)
- [`pending`](#pending) (*non standard*)

and all of them as globals if the corresponding globals do not already exist.

This repository provides also some [tools](#promise-tools) (most just need
Promise A+ to work):

- [`CancellableChain`](#cancellablechain) (*cancellable promise needed*)
- [`firstFulfilled`](#firstfulfilled)
- [`Promise based forEach`](#promise-based-foreach)
- [`Promise based map`](#promise-based-map)
- [`Promise based reduce`](#promise-based-reduce)
- [`Promise based worker`](#promise-based-worker)
- [`range`](#range)
- [`sleep`](#sleep)
- [`spawn`](#spawn)

It also provides a `toScript` function which return the library script as a
string. All functions and objects bounded to `promy` can provide a `toScript`
function which will be appended to the `promy` one to build a bundle of
libraries as a string.

### Promise

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

- `promise.then([onFulfill], [onReject], [onNotify])`
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


### Promise.cast()

    cast(value): Promise< value >

If `value` is not a promy promise, it creates a new promise and resolve with
`value`. Else it returns the `value`.


### Promise.resolve()

    Promise.resolve(value): Promise< value >

If `value` is not a thenable, it creates a new promise and resolve with
`value`. Else it returns the `value`. `Promise.resolve` is also a fulfilled
promise.


### Promise.reject()

### rejected()

    Promise.reject(reason): Promise< reason >
    rejected(reason): Promise< reason >

Produces a new resolved promise with `value` as fulfillment value.  For
consistency and debugging, the reason should be an instance of `Error`. If
`value` is a rejected promy promise, it just returns `value`. `reject` is
also a rejected promise.


### Promise.fulfill()

### fulfilled()

    Promise.fulfill(value): Promise< value >
    fulfilled(value): Promise< value >

Produces a new resolved promise with `value` as fulfillment value.  If `value`
is a fulfilled promy promise, it just returns `value`. `Promise.fulfill` is also
a fulfilled promise.


### Promise.notify()

    Promise.notify(notification[, answer]): Promise< answer >

Creates a new promise which notifies with `notification` and resolve with
`answer`.

### Promise.all()

    all(promises): Promise< promises_fulfilment_values >
    all(promises): Promise< one_rejected_reason >

Produces a promise that is resolved when all the given `promises` are
fulfilled. The fulfillment value is an array of each of the fulfillment values
of the promise array.

If one of the promises is rejected, the `all` promise will be rejected with the
same rejected reason, and the remaining unresolved promises will be cancelled.


### Promise.race()

    race(promises): promise< first_value >

Produces a promise that is fulfilled when any one of the given promises is
fulfilled. As soon as one of the promises is resolved, whether by being
fulfilled or rejected, all the other promises are cancelled.


### CancelException

The Exception raised when a promise is cancelled.


### pending()

    pending(): Promise

Returns a defer object of a new pending promise. This object provides the
`promise` property which is the new promise, and also provides `fulfill`,
`reject` and `notify` methods to resolve the promise. `canceller` is executed on
cancel if this property is defined.


Promise Tools
-------------

### CancellableChain

A cancellable and notification propagation Promise A+ tool to cancel a complete
sequence of `then` promises since the creation of the cancellable chain.

This library is useless with Promise A+ without notification and cancellation.

File: `cancellablechain.js`

Version: v1.1.0 - [License: WTFPLv2](#license)

If the global `promy` exists, then `promy.CancellableChain` is added and if the
global `CancellableChain` does not exist, it is also provided. Else, if the
global `promy` does not exist, then only the global `CancellableChain` will be
provided. It also provides `CancellableChain.toScript`, a function which return
this library script as a string.

API:

    new CancellableChain(value)

Acts like promise chain with the then function. In addition, all the sequence
can be cancelled by calling the `cancel` method.

Details:

    var a = new CancellableChain("a");
    var b = a.then(...);
    var c = b.then(...);
    var d = c.detach();
    var e = d.then(...);
    // with a, b or c, cancel() will cancel a, b and c
    // d.cancel() will cancel a, b, c and d
    // e.cancel() will just cancel e

Example: chaining from function

    function doSomething() {
      return new CancellableChain("a").
        then(canBeCancelled).
        then(soDoThisOne).
        detach();
        // Here, it is better to detach the chain to avoid continuing it in
        // the parent promises chain.
    }
    doSomething().then(...);

Example: use in then

    function doSomething() {
      return new CancellableChain("b").
        then(canBeCancelled).
        then(soDoThisOne);
        // Here, we know that this function will be called in a `then`. We
        // don't have to detach the chain because its `then` method won't
        // be called.
    }
    Promise.resolve().then(doSomething).then(...);

Differences between `CancellableChain` and `Promise`:

- The `then` method returns a cancellable chain
- The `cancel` method cancels all the then sequence since the `CancellableChain`
  creation.
- `detach` is an additional method to return a promise which can cancel the
  chain on `promise.cancel()`.


### firstFulfilled

A cancellable and notification propagation Promise A+ tool to get the first
fulfilled promise from a list of promises.

File: `firstFulfilled.js`

Version: v1.1.0 - [License: WTFPLv2](#license)

If the global `promy` exists, then `promy.firstFulfilled` is added and if the
global `firstFulfilled` does not exist, it is also provided. Else, if the global
`promy` does not exist, then only the global `firstFulfilled` will be provided.
It also provides `firstFulfilled.toScript`, a function which return this library
script as a string.

It uses by default `promy.Promise` as promise mechanism. If `promy` is not
provided, then the global `Promise` will be used instead.

API:

    firstFulfilled(promises): promises< last_fulfilment_value >

Param:

- `{Array} promises` An array of promises

Returns:

- `{Promise}` A new promise

Responds with the first resolved promise answer recieved. If all promises are
rejected, it returns the last rejected promise answer received. Promises are
cancelled only by calling `firstFulfilled(promises).cancel()`.


### Promise based forEach

A cancellable and notification propagation Promise A+ tool to iterate an array.

File: `promisebasedforeach.js`

Version: v1.1.1 - [License: WTFPLv2](#license)

If the global `promy` exists, then `promy.forEach` is added and if the global
`forEach` does not exist, it is also provided. Else, if the global `promy` does
not exist, then only the global `forEach` will be provided. It also provides
`forEach.toScript`, a function which return this library script as a string.

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


### Promise based map

A cancellable and notification propagation Promise A+ tool to map an array.

File: `promisebasedmap.js`

Version: v1.1.1 - [License: WTFPLv2](#license)

If the global `promy` exists, then `promy.map` is added and if the global `map`
does not exist, it is also provided. Else, if the global `promy` does not exist,
then only the global `map` will be provided. It also provides `map.toScript`, a
function which return this library script as a string.

It uses by default `promy.Promise` as promise mechanism. If `promy` is not
provided, then the global `Promise` will be used instead.

API:

    map(array, callback[, thisArg]): Promise

Param:

- `{Array} array` The array to parse
- `{Function} callback` Function to execute for each element.
- `{Any} [thisArg]` Value to use as `this` when executing `callback`.

Returns:

- `{Promise}` A new promise with a mapped array as fulfillment value.

It executes the provided `callback` once for each element in an array, in order,
and constructs a new array from the results asynchronously. If the `callback`
returns a promise, then the function will wait for its fulfillment before
executing the next iteration.

`callback` is invoked with three arguments:

- the element value
- the element index
- the array being traversed

If a `thisArg` parameter is provided to `forEach`, it will be passed to
`callback` when invoked, for use as its `this` value.  Otherwise, the value
`undefined` will be passed for use as its `this` value.

Unlike `Array.prototype.map`, you can stop the iteration by throwing something,
or by doing a `cancel` to the returned promise if it is cancellable promise.

Inspired by `Array.prototype.map` from Mozilla Developer Network.

    map(["a", "b", "c"], function (value, index, array) {
      return ajaxGetValueSomewhere(value);
    }).then(onDone, onError, onNotify);


### Promise based reduce

A cancellable and notification propagation Promise A+ tool to iterate an array
to reduce it to a single value.

File: `promisebasedreduce.js`

Version: v1.1.1 - [License: WTFPLv2](#license)

If the global `promy` exists, then `promy.reduce` is added and if the global
`reduce` does not exist, it is also provided. Else, if the global `promy` does
not exist, then only the global `reduce` will be provided. It also provides
`reduce.toScript`, a function which return this library script as a string.

It uses by default `promy.Promise` as promise mechanism. If `promy` is not
provided, then the global `Promise` will be used instead.

API:

    reduce(array, callback[, initialValue]): Promise< reduced_value >

Param:

- `{Array} array` The array to parse
- `{Function} callback` Function to execute on each element in the array.
- `{Any} [initialValue]` Object to use as the first argument to the
                             first call of the callback

Returns:

- `{Promise}` A new promise with the reduced value as fulfillment value.

It executes the `callback` function once for each element present in the
array, excluding holes in the array, receiving four arguments: the initial
value (or value from the previous `callback` call), the value of the
current element, the current index, and the array over which iteration is
occurring. If the `callback` returns a promise, then the function will take
its fulfillment value as returned value before executing the next
iteration.

`callback` is invoked with four arguments:

- `previousValue`: the value previously returned in the last invocation of
   the callback, or `initialValue`, if supplied. (See below.)
- `currentValue`: the current element being processed in the array.
- `index`: the index of the current element being processed in the array.
- `array`: the array `reduce` was called upon.

The first time the callback is called, `previousValue` and `currentValue`
can be one of two values. If `initialValue` is provided in the call to
`reduce`, then `previousValue` will be equal to `initialValue` and
`currentValue` will be equal to the first value in the array. If no
`initialValue` was provided, then `previousValue` will be equal to the
first value in the array and `currentValue` will be equal to the second.

Inspired by [`Array.prototype.reduce`][reduce()] from Mozilla Developer Network.

[reduce()]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce

    reduce([11111, 22222, 33333], function(a, b) {
      return workerMultiply(a, b);
    }).then(function (total) {
      // total = 11111 * 22222 * 33333 = 8230205763786
    });


### Promise based worker

A cancellable and notification propagation Promise A+ tool to do something in
background.

File: `promisebasedworker.js`

Version: v1.1.0 - [License: WTFPLv2](#license)

If the global `promy` exists, then `promy.worker` is added and if the global
`worker` does not exist, it is also provided. Else, if the global `promy` does
not exist, then only the global `worker` will be provided. It also provides
`worker.toScript`, a function which return this library script as a string.

It uses by default `promy.Promise` as promise mechanism. If `promy` is not
provided, then the global `Promise` will be used instead.

API:

    worker(script) : task

Param:

- `{Function|String} script` The script to run in the web worker.

Returns:

- `{Function}` The worker function.

Produces a function `task` which is able to execute a `script` in a web
worker. Each time the `task` is launched, a new web worker is created and
executed.

`task` can take one serializable parameter which will be the `onmessage` event
data in the web worker.

`script` can be a function or a string. If the script is a string, then it
should contains an assignement to the global `onmessage` listener.  Otherwise,
the `script` function will be automatically assigned to `onmessage`.

    var task = worker(function (event) {
      /*global resolve, reject, notify */
      notify(event.data + 1);
      notify(event.data + 2);
      resolve(event.data + 3);
    });
    task(3).then(console.log, console.warn, console.info);
    // (i)> 4
    // (i)> 5
    //    > 6


### range()

A cancellable and notification propagation Promise A+ tool to iterate a range.

File: `range.js`

Version: v1.1.1 - [License: WTFPLv2](#license)

If the global `promy` exists, then `promy.range` is added and if the global
`range` does not exist, it is also provided. Else, if the global `promy` does
not exist, then only the global `range` will be provided. It also provides
`range.toScript`, a function which return this library script as a string.

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


### sleep

A cancellable Promise A+ tool to sleep asynchronous process.

File: `sleep.js`

Version: 1.1.0 - [License: WTFPLv2](#license)

If the global `promy` exists, then `promy.sleep` is added and if the global
`sleep` does not exist, it is also provided. Else, if the global `promy` does
not exist, then only the global `sleep` will be provided. It also provides
`sleep.toScript`, a function which return this library script as a string.

It uses by default `promy.Promise` as promise mechanism. If `promy` is not
provided, then the global `Promise` will be used instead.

API:

    sleep(delay, [value]): promise< value >

Param:

- `{Number}` delay The time to sleep.
- `{Any} [value]` The value to resolve.

Returns:

- `{Promise}` A new promise.

Produces a new promise which will resolve with `value` after `delay`
milliseconds.


### spawn

A cancellable and notification propagation Promise A+ tool to write asynchronous
operations with a simple genetor function.

File: `spawn.js`

Version: 1.1.0 - [License: WTFPLv2](#license)

If the global `promy` exists, then `promy.spawn` is added and if the global
`spawn` does not exist, it is also provided. Else, if the global `promy` does
not exist, then only the global `spawn` will be provided. It also provides
`spawn.toScript`, a function which return this library script as a string.

API:

    spawn(generator): Promise< returned_value >

Param:

- `{Function} generator` A generator function.

Returns:

- `{Promise}` A new promise

Use generator function to do asynchronous operations sequentialy using `yield`
operator.

    spawn(function* () {
      try {
        var config = yield getConfig();
        config.enable_something = true;
        yield sleep(1000);
        yield putContif(config);
      } catch (e) {
        console.error(e);
      }
    });


License
-------

> Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>

> This program is free software. It comes without any warranty, to
> the extent permitted by applicable law. You can redistribute it
> and/or modify it under the terms of the Do What The Fuck You Want
> To Public License, Version 2, as published by Sam Hocevar. See
> the COPYING file for more details.
