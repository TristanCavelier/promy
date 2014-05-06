/*jslint indent: 2, maxlen: 80, nomen: true */

(function factory(root) {
  "use strict";

  /*
   * CancellableChain
   *
   * A cancellable and notification propagation Promise A+ tool to cancel a
   * complete sequence of `then` promises since the creation of the cancellable
   * chain.
   *
   * Version: v1.1.1
   *
   * Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
   * This program is free software. It comes without any warranty, to
   * the extent permitted by applicable law. You can redistribute it
   * and/or modify it under the terms of the Do What The Fuck You Want
   * To Public License, Version 2, as published by Sam Hocevar. See
   * the COPYING file for more details.
   */

  /*
   * It uses by default `promy.Promise` as promise mechanism. If `promy` is not
   * provided, then the global `Promise` will be used instead.
   */
  function newPromise(executor, canceller) {
    var Cons = ((root.promy && root.promy.Promise) || root.Promise);
    return new Cons(
      executor,
      canceller
    );
  }

  function resolve(v) {
    return newPromise(function (done) { done(v); });
  }

  /**
   *     new CancellableChain(value)
   *
   * Acts like promise chain with the then function. In addition, all the
   * sequence can be cancelled by calling the `cancel` method.
   *
   * Details:
   *
   *     var a = new CancellableChain("a");
   *     var b = a.then(...);
   *     var c = b.then(...);
   *     var d = c.detach();
   *     var e = d.then(...);
   *     // with a, b or c, cancel() will cancel a, b and c
   *     // d.cancel() will cancel a, b, c and d
   *     // e.cancel() will just cancel e
   *
   * Example: chaining from function
   *
   *     function doSomething() {
   *       return new CancellableChain("a").
   *         then(canBeCancelled).
   *         then(soDoThisOne).
   *         detach();
   *         // Here, it is better to detach the chain to avoid continuing it in
   *         // the parent promises chain.
   *     }
   *     doSomething().then(...);
   *
   * Example: use in then
   *
   *     function doSomething() {
   *       return new CancellableChain("b").
   *         then(canBeCancelled).
   *         then(soDoThisOne);
   *         // Here, we know that this function will be called in a `then`. We
   *         // don't have to detach the chain because its `then` method won't
   *         // be called.
   *     }
   *     Promise.resolve().then(doSomething).then(...);
   *
   * Differences between `CancellableChain` and `Promise`:
   *
   * - The `then` method returns the cancellable chain
   * - The `cancel` method cancels all the then sequence since the
   *   `CancellableChain` creation.
   * - `detach` is an additional method to return a promise which can cancel the
   *   chain on `promise.cancel()`.
   *
   *
   * @class CancellableChain
   * @constructor
   * @param  {Any} value The value to resolve
   */
  function CancellableChain(value) {
    if (!(this instanceof CancellableChain)) {
      return new CancellableChain(value);
    }
    if (arguments.length > 0) {
      this._value = value;
    }
  }

  /**
   *     then(done, fail, progress): CancellableChain
   *
   * Acts like `promise.then` method, and also keep the chain operation in order
   * to cancel each link one by one.
   *
   * @method then
   * @param  {Function} done The callback to call on fulfill
   * @param  {Function} fail The callback to call on reject
   * @param  {Function} progress The callback to call on progress
   * @return {CancellableChain} A new cancellable chain
   */
  CancellableChain.prototype.then = function (done, fail, progress) {
    if (!this._current) {
      this._current = resolve(this._value);
      delete this._value;
    }

    var cc = new CancellableChain();
    cc._parent = this;
    cc._current = this._current.then(function (answer) {
      delete cc._parent;
      if (typeof done === "function") {
        return done(answer);
      }
      return answer;
    }, function (reason) {
      delete cc._parent;
      if (typeof fail === "function") {
        return fail(reason);
      }
      return reason;
    }, progress);
    return cc;
  };

  /**
   *     catch(fail): CancellableChain
   *
   * A shortcut for `then(null, fail)`.
   *
   * @method catch
   * @param  {Function} fail The callback to call on reject
   * @return {CancellableChain} A new cancellable chain
   */
  CancellableChain.prototype.catch = function (fail) {
    return this.then(null, fail);
  };

  /**
   *     progress(progress): CancellableChain
   *
   * A shortcut for `then(null, null, progress)`.
   *
   * @method progress
   * @param  {Function} progress The callback to call on notify
   * @return {CancellableChain} A new cancellable chain
   */
  CancellableChain.prototype.progress = function (progress) {
    return this.then(null, null, progress);
  };

  /**
   *     cancel(): CancellableChain
   *
   * Cancels each link of the chain operation by rejecting them with
   * CancelException() and calling the canceller callback.
   *
   * @method cancel
   * @return {CancellableChain} Itself
   */
  CancellableChain.prototype.cancel = function () {
    if (!this._current) {
      this._current = resolve(this._value);
      delete this._value;
    }

    if (this._parent && typeof this._parent.cancel === "function") {
      this._parent.cancel();
      delete this._parent;
    }
    if (typeof this._current.cancel === "function") {
      this._current.cancel();
    }
    return this;
  };

  /**
   *     detach(): Promise
   *
   * Returns the cancellable chain as a classic promise.
   *
   * @method detach
   * @return {Promise} A new promise
   */
  CancellableChain.prototype.detach = function () {
    if (!this._current) {
      this._current = resolve(this._value);
      delete this._value;
    }

    var dis = this;
    return newPromise(function (resolve, reject, notify) {
      dis._current.then(resolve, reject, notify);
    }, function () {
      dis.cancel();
    });
  };

  /*
   * If the global `promy` exists, then `promy.CancellableChain` is added and if
   * the global `CancellableChain` does not exist, it is also provided. Else, if
   * the global `promy` does not exist, then only the global `CancellableChain`
   * will be provided.
   */
  if (root.promy) {
    root.promy.CancellableChain = CancellableChain;
    if (root.CancellableChain === undefined) {
      root.CancellableChain = CancellableChain;
    }
  } else {
    root.CancellableChain = CancellableChain;
  }

  /**
   * Prepare `toScript` function to export easily this library as a string.
   */
  Object.defineProperty(CancellableChain, "toScript", {
    "configurable": true,
    "enumerable": false,
    "writable": true,
    "value": function () {
      return "(" + factory.toString() + "(this));";
    }
  });

}(this));
