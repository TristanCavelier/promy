// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

// Promy
// A Promise A+ compatible library with cancellation and notification
// v1.0.0

/*jslint indent: 2, maxlen: 80, nomen: true, node: true */
/*global setTimeout, setImmediate */

// http://www.html5rocks.com/en/tutorials/es6/promises/
// https://people.mozilla.org/~jorendorff/es6-draft.html

(function (root) {
  "use strict";

  /*
   * This part is inspired from RSVP.js
   * https://github.com/tildeio/rsvp.js
   * MIT License: Copyright (c) 2013 Yehuda Katz, Tom Dale, and contributors
   */

  var async, promise_cast, promy = {}, isArray = Array.isArray;

  //////////////////////////////////////////////////////////////////////

  /**
   * The Exception raised when a promise is cancelled.
   *
   * @class CancelException
   * @constructor
   */
  function CancelException(message) {
    Error.call(this);
    if (typeof message === 'string') {
      this.message = message;
    } else {
      this.message = "";
    }
  }
  CancelException.prototype = new Error();
  Object.defineProperties(CancelException.prototype, {
    "constructor": {
      "configurable": true,
      "enumerable": false,
      "writable": true,
      "value": CancelException
    },
    "name": {
      "configurable": true,
      "enumerable": false,
      "writable": true,
      "value": "CancelException"
    }
  });

  promy.CancelException = CancelException;

  //////////////////////////////////////////////////////////////////////

  /**
   * on.call(promise, type, listener): promise
   *
   * Bind a listener to an object to its `_events` property to be EventEmitter
   * compatible (from nodejs). `this` object should be a promise.
   *
   * @param  {String} type The event name
   * @param  {Function} listener The listener to bind
   * @return {Promise} The promise
   */
  function on(type, listener) {
    if (!this._events) {
      this._events = {};
    }
    if (!this._events[type]) {
      // Enable compatibility for node EventEmitter, the event listener array
      // which contains only one value is shortened to the sole listener.
      this._events[type] = listener;
    } else if (typeof this._events[type] === "function") {
      // If the event listener array is a listener, then create the array
      this._events[type] = [this._events[type], listener];
    } else if (isArray(this._events[type])) {
      this._events[type].push(listener);
    } // else do nothing
    return this;
  }

  /**
   * emit.call(promise, type, [args*]): promise
   *
   * Call the listeners bound to the object in its `_events` property to be
   * EventEmitter compatible (from nodejs). `this` object should be a promise.
   *
   * @param  {String} type The event name
   * @param  {Function} listener The listener to bind
   * @return {Promise} The promise
   */
  function emit(type) {
    if (!this._events || !this._events[type]) {
      return this;
    }
    var args, funs, i;
    funs = this._events[type];
    if (typeof funs === "function") {
      // Enable compatibility with EventEmitter, the event listener can be a
      // listener
      funs.apply(null, [].slice.call(arguments, 1));
      return this;
    }
    if (isArray(funs)) {
      funs = funs.slice();
      args = [].slice.call(arguments, 1);
      for (i = 0; i < funs.length; i += 1) {
        funs[i].apply(null, args);
      }
    }
    return this;
  }

  //////////////////////////////////////////////////////////////////////

  // Assign `async` to the setImmediate function if exist
  // else use the setTimeout as setImmediate
  if (typeof setImmediate === "function") {
    async = setImmediate;
  } else {
    async = function (fn) {
      setTimeout.apply(null, [fn, 0].concat([].slice.call(arguments, 1)));
    };
  }

  //////////////////////////////////////////////////////////////////////

  /**
   * objectOrFunction(v): boolean
   *
   * Test if `v` is of type 'object' and not null or 'function'
   *
   * @param  {Any} v The value to test
   * @return {Boolean} The test result
   */
  function objectOrFunction(v) {
    return typeof v === "function" || (typeof v === "object" && v !== null);
  }

  /**
   * fulfill(promise, value): undefined
   *
   * Fulfills the promise with the given value if not settled.
   *
   * @param  {Promise} promise The promise to fulfill
   * @param  {Any} value The fulfillment value
   */
  function fulfill(promise, value) {
    async(function () {
      if (!promise.settled) {
        promise.isFulfilled = true;
        promise.settled = true;
        promise.fulfillmentValue = value;
        emit.call(promise, "promise:resolved", {"detail": value});
      }
    });
  }

  /**
   * reject(promise, value): undefined
   *
   * Rejects the promise with the given value if not settled.
   *
   * @param  {Promise} promise The promise to reject
   * @param  {Any} value The rejection value
   */
  function reject(promise, value) {
    async(function () {
      if (!promise.settled) {
        promise.isRejected = true;
        promise.settled = true;
        promise.rejectedReason = value;
        emit.call(promise, "promise:failed", {"detail": value});
      }
    });
  }

  /**
   * notify(promise, value): undefined
   *
   * Sends a notification to the promise with the given value if not settled.
   *
   * @param  {Promise} promise The promise to reject
   * @param  {Any} value The rejected value
   */
  function notify(promise, value) {
    async(function () {
      if (!promise.settled) {
        emit.call(promise, "promise:notified", {"detail": value});
      }
    });
  }

  /**
   * resolve(promise, value): undefined
   *
   * Fulfill the promise with the given value. If the value is a thenable object
   * or function, the promise will be fulfilled by the thenable fulfillment
   * value or the promise will be rejected by the thenable rejected reason. If
   * the value is equal to the promise, then the promise will be fulfilled with
   * itself as fulfillment value.
   *
   * @param  {Promise} promise The promise to resolve
   * @param  {Any} value The value set for fulfillment or rejection.
   */
  function resolve(promise, value) {
    /*global handleThenable*/
    // the handleThenable cannot operate with promise === value, so in this
    // case, the promise is fulfilled with itself as fulfillment value.
    if (promise === value || !handleThenable(promise, value)) {
      fulfill(promise, value);
    }
  }

  /**
   * handleThenable(promise, value): Boolean
   *
   * Handles  the value  as  a possible  thenable object  or  function. If  this
   * function manage  to handle the thenable,  it will resolve the  promise with
   * the thenable value and return true. Otherwise, it returns false.
   *
   * @param  {Promise} promise The promise to resolve
   * @param  {Any} value The value set for fulfillment or rejection
   * @return {Boolean} true if succeed to resolve
   */
  function handleThenable(promise, value) {
    var then = null, resolved;
    // the resolved variable prevents the then functions to call resolve or
    // reject more than one time.
    try {
      if (promise === value) {
        throw new TypeError("A promises callback cannot " +
                            "return that same promise.");
      }
      if (objectOrFunction(value)) {
        then = value.then;
        if (typeof then === "function") {
          on.call(promise, "promise:cancelled", function () {
            if (typeof value.cancel === "function") {
              value.cancel();
            }
          });
          then.call(value, function (val) {
            if (resolved) {
              return true;
            }
            resolved = true;
            if (value !== val) {
              resolve(promise, val);
            } else {
              // if the returned value is the current thenable, do a `resolve`
              // will do an infernal loop. So the promise must be fulfilled
              // directly.
              fulfill(promise, val);
            }
          }, function (val) {
            if (resolved) {
              return true;
            }
            resolved = true;
            reject(promise, val);
          }, function (notification) {
            notify(promise, notification);
          });
          return true;
        }
      }
    } catch (error) {
      reject(promise, error);
      return true;
    }
    return false;
  }

  // XXX docstring
  // XXX rename?
  function invokeCallback(type, promise, callback, event) {
    var hasCallback, value, error, succeeded, failed;
    hasCallback = typeof callback === "function";
    if (hasCallback) {
      try {
        if (event.detail === undefined) {
          value = callback();
        } else {
          value = callback(event.detail);
        }
        succeeded = true;
      } catch (e) {
        failed = true;
        error = e;
      }
    } else {
      value = event.detail;
      succeeded = true;
    }
    if (handleThenable(promise, value)) {
      return;
    }
    if (hasCallback && succeeded) {
      resolve(promise, value);
    } else if (failed) {
      reject(promise, error);
    } else if (type === "onResolve") {
      resolve(promise, value);
    } else if (type === "onReject") {
      reject(promise, value);
    }
  }

  // XXX docstring
  function invokeNotifyCallback(promise, callback, event) {
    var value;
    if (typeof callback === "function") {
      try {
        value = callback(event.detail);
      } catch (e) {
        // stop propagation
        return;
      }
      notify(promise, value);
    } else {
      notify(promise, event.detail);
    }
  }

  //////////////////////////////////////////////////////////////////////

  /**
   * Promise(executor[, canceller])
   *
   * @class Promise
   * @constructor
   */
  function Promise(executor, canceller) {
    var promise = this;
    if (!(promise instanceof Promise)) {
      return new Promise(executor, canceller);
    }
    if (typeof executor !== "function") {
      throw new TypeError("Promise(executor[, canceller]): " +
                          "resolver must be a function");
    }
    if (typeof canceller === "function") {
      on.call(this, "promise:cancelled", canceller);
    }
    function resolvePromise(value) {
      resolve(promise, value);
    }
    function rejectPromise(value) {
      reject(promise, value);
    }
    function notifyPromise(value) {
      notify(promise, value);
    }
    try {
      executor(resolvePromise, rejectPromise, notifyPromise);
    } catch (e) {
      rejectPromise(e);
    }
  }

  Promise.prototype.isRejected = false;
  Promise.prototype.isFulfilled = false;
  Promise.prototype.rejectedReason = null;
  Promise.prototype.fulfillmentValue = null;
  Promise.prototype.settled = false;

  // // Used for debugging
  // Promise.prototype.on = on;
  // Promise.prototype.once = once;
  // Promise.prototype.emit = emit;
  // Promise.prototype.removeListener = removeListener;
  // Promise.prototype.resolve = function (value) {
  //   resolve(this, value);
  // };
  // Promise.prototype.reject = function (value) {
  //   reject(this, value);
  // };
  // Promise.prototype.notify = function (value) {
  //   notify(this, value);
  // };

  /**
   * then(done, fail, progress): Promise
   *
   * Bind callbacks to the promise to chain operation on promise resolve.
   *
   * @method then
   * @param  {Function} done The callback to call on fulfill
   * @param  {Function} fail The callback to call on reject
   * @param  {Function} progress The callback to call on progress
   * @return {Promise} A new promise
   */
  Promise.prototype.then = function (done, fail, progress) {
    var thenPromise = new this.constructor(function () { return; });
    if (this.settled) {
      if (this.isFulfilled) {
        async(function (promise) {
          invokeCallback("onResolve", thenPromise, done, {
            "detail": promise.fulfillmentValue
          });
        }, this);
      }
      if (this.isRejected) {
        async(function (promise) {
          invokeCallback("onReject", thenPromise, fail, {
            "detail": promise.rejectedReason
          });
        }, this);
      }
    } else {
      on.call(this, "promise:resolved", function (event) {
        invokeCallback("onResolve", thenPromise, done, event);
      });
      on.call(this, "promise:failed", function (event) {
        invokeCallback("onReject", thenPromise, fail, event);
      });
      on.call(this, "promise:notified", function (event) {
        invokeNotifyCallback(thenPromise, progress, event);
      });
    }
    return thenPromise;
  };

  /**
   * catch(fail): Promise
   *
   * A shortcut for `then(null, fail)`.
   *
   * @method catch
   * @param  {Function} fail The callback to call on reject
   * @return {Promise} A new promise
   */
  Promise.prototype.catch = function (fail) {
    return this.then(null, fail);
  };

  /**
   * progress(progress): Promise
   *
   * A shortcut for `then(null, null, progress)`.
   *
   * @method progress
   * @param  {Function} progress The callback to call on progress
   * @return {Promise} A new promise
   */
  Promise.prototype.progress = function (progress) {
    return this.then(null, null, progress);
  };

  /**
   * cancel(cancel): Promise
   *
   * Cancels the promise by rejecting it with CancelException() and calling the
   * canceller callback.
   *
   * @method cancel
   * @param  {Function} cancel The callback to call on cancel
   * @return {Promise} A new promise
   */
  Promise.prototype.cancel = function (cancel) {
    if (!this.settled) {
      // bind cancel callback to on reject in order to be called just after the
      // cancellation.
      if (typeof cancel === "function") {
        return this.then(null, function (reason) {
          if (reason instanceof CancelException) {
            return cancel(reason);
          }
        });
      }
      reject(this, new CancelException());
      // call .cancel() to the inside then callback returned promise
      emit.call(this, "promise:cancelled", {}); // "detail": undefined
    }
    return this;
  };

  promy.Promise = Promise;

  /**
   * cast(value): Promise< value >
   * cast(promise): promise
   *
   * If the value is not a promise, creates a new promise and resolve to the
   * given value. Else it returns the promise.
   *
   * @param  {Any} value The value to give
   * @return {Promise} A new promise
   */
  Promise.cast = function (value) {
    if (value instanceof Promise) {
      return value;
    }
    return new Promise(function (resolve) {
      resolve(value);
    }); // no canceller needed, value canceller is used instead
  };
  promise_cast = Promise.cast;

  /**
   * resolve(value): Promise< value >
   *
   * Creates a new promise and resolves it to the given value.
   *
   * @param  {Any} value The value to give
   * @return {Promise} A new promise
   */
  Promise.resolve = function (value) {
    return new Promise(function (resolve) {
      resolve(value);
    }); // no canceller needed, value canceller is used instead
  };

  /**
   * fulfill(value): Promise< value >
   *
   * Creates a new promise and fulfill it to the given value. If the value is a
   * promise, then the returned value will be the fulfillment value.
   *
   * @param  {Any} value The value to give
   * @return {Promise} A new fulfilled promise
   */
  Promise.fulfill = function (value) {
    var p = promise_cast(value);
    return new Promise(function (resolve, reject, notify) {
      /*jslint unparam: true */
      p.then(resolve, resolve, notify);
    }, p.cancel.bind(p));
  };

  /**
   * reject(reason): Promise< reason >
   *
   * Creates a new promise and rejects it to the given reason. For consistency
   * and debugging, the reason should be an instance of Error. If the reason is
   * a promise, then the returned value will be the rejected reason.
   *
   * @param  {Any} reason The reason to give
   * @return {Promise} A new rejected promise
   */
  Promise.reject = function (reason) {
    var p = promise_cast(reason);
    return new Promise(function (resolve, reject, notify) {
      /*jslint unparam: true */
      p.then(reject, reject, notify);
    }, p.cancel.bind(p));
  };

  /**
   * all(promises): Promise< promises_fulfilment_values >
   * all(promises): Promise< one_rejected_reason >
   *
   * Produces a promise that is resolved when all the given promises are
   * resolved. The resolved value is an array of each of the resolved values of
   * the given promises.
   *
   * If any of the promises is rejected, the joined promise is rejected with the
   * same error, and any remaining unfulfilled promises are cancelled.
   *
   * @param  {Array} promises An array of promises
   * @return {Promise} A promise
   */
  Promise.all = function (promises) {
    var length = promises.length;
    promises = promises.map(function (value) {
      return promise_cast(value);
    });

    function cancel() {
      var i;
      for (i = 0; i < length; i += 1) {
        if (typeof promises[i].cancel === "function") {
          promises[i].cancel();
        }
      }
    }

    return new Promise(function (resolve, reject, notify) {
      var i, count = 0, results = [];
      function resolver(i) {
        return function (value) {
          count += 1;
          results[i] = value;
          if (count === length) {
            resolve(results);
          }
        };
      }

      function rejecter(err) {
        reject(err);
        cancel();
      }

      function notifier(i) {
        return function (value) {
          notify({
            "function": "all",
            "index": i,
            "value": value
          });
        };
      }
      for (i = 0; i < length; i += 1) {
        promises[i].then(resolver(i), rejecter, notifier(i));
      }
    }, cancel);
  };

  /**
   * race(promises): promise< first_value >
   *
   * Produces a promise that is fulfilled when any one of the given promises is
   * fulfilled. As soon as one of the promises is fulfilled, whether by being
   * resolved or rejected, all the other promises are cancelled.
   *
   * @param  {Array} promises An array of promises
   * @return {Promise} A promise
   */
  Promise.race = function (promises) {
    var length = promises.length;
    promises = promises.slice(); // copy promises

    if (length === 0) {
      return Promise.resolve();
    }

    function cancel() {
      var i;
      for (i = 0; i < length; i += 1) {
        if (typeof promises[i].cancel === "function") {
          promises[i].cancel();
        }
      }
    }

    return new Promise(function (resolve, reject, notify) {
      var i, ended = false;
      function resolver(value) {
        if (!ended) {
          ended = true;
          resolve(value);
          cancel();
        }
      }

      function rejecter(err) {
        if (!ended) {
          ended = true;
          reject(err);
          cancel();
        }
      }

      function notifier(i) {
        return function (value) {
          notify({
            "function": "race",
            "index": i,
            "value": value
          });
        };
      }
      for (i = 0; i < length; i += 1) {
        promises[i].then(resolver, rejecter, notifier(i));
      }
    }, cancel);
  };

  /**
   * pending([canceller]): Promise
   *
   * Returns a defer object of a new pending promise. This object provides the
   * `promise` property which is the new promise, and also provides `fulfill`,
   * `reject` and `notify` methods to resolve the promise.
   *
   * @return {Function} [canceller] The promise canceller
   * @return {Promise} A pending promise defer object
   */
  function pending(canceller) {
    var dict = {}, promise = new Promise(function (resolve, reject, notify) {
      dict.fulfill = resolve;
      dict.reject = reject;
      dict.notify = notify;
    }, canceller);
    promise.promise = promise;
    promise.fulfill = dict.fulfill;
    promise.reject = dict.reject;
    promise.notify = dict.notify;
    return promise;
    // We could also create a PendingPromise object which could already provide
    // such thing (in prototypes);
  }

  promy.rejected = Promise.reject;
  promy.fulfilled = Promise.fulfill;
  promy.pending = pending;

  root.promy = promy;

}(this));