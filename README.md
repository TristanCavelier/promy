promy
=====

A Promise A+ compatible library with cancellation and notification

Version: v1.0.0


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

*API:*

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

Inspired by [`Array.prototype.forEach`][1] from Mozilla Developer Network.

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach

    forEach(["a", "b", "c"], function (value, index, array) {
      return ajaxPostValueSomewhere(value);
    }).then(onDone, onError, onNotify);


Range
-----

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

Inspired by [`range()`][1] from Python 3 built-in functions.

[1]: http://docs.python.org/3.4/library/functions.html#func-range

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
