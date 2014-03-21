// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80, nomen: true */

(function (root) {
  "use strict";

  var Promise = root.promy.Promise;

  /**
   * Acts like promise chain with the then function. In addition, all the
   * sequence can be cancelled by calling the `cancel` method.
   *
   *     function doSomething() {
   *       return new CancellableChain("a").
   *         then(willNeverHappen).
   *         detach();
   *     }
   *     doSomething().cancel();
   *
   * @class CancellableChain
   * @constructor
   * @param  {Any}
   */
  function CancellableChain(value) {
    this._promises = [Promise.resolve(value).then()];
  }

  /**
   * then(done, fail, progress): CancellableChain
   *
   * Acts like `promise.then` method, and also keep the chain operation in order
   * to cancel each link one by one.
   *
   * @method then
   * @param  {Function} done The callback to call on fulfill
   * @param  {Function} fail The callback to call on reject
   * @param  {Function} progress The callback to call on progress
   * @return {CancellableChain} Itself
   */
  CancellableChain.prototype.then = function (done, fail, progress) {
    var promises = this._promises, l = promises.length;
    promises[l] = promises[l - 1].then(function (answer) {
      promises.shift();
      return done(answer);
    }, function (reason) {
      promises.shift();
      return fail(reason);
    }, progress);
    return this;
  };

  /**
   * catch(fail): CancellableChain
   *
   * A shortcut for `then(null, fail)`.
   *
   * @method catch
   * @param  {Function} fail The callback to call on reject
   * @return {CancellableChain} Itself
   */
  CancellableChain.prototype.catch = function (fail) {
    return this.then(null, fail);
  };

  /**
   * cancel(): CancellableChain
   *
   * Cancels each link of the chain operation by rejecting them with
   * CancelException() and calling the canceller callback.
   *
   * @method cancel
   * @return {CancellableChain} Itself
   */
  CancellableChain.prototype.cancel = function () {
    var i, promises = this._promises, l = promises.length;
    for (i = 0; i < l; i += 1) {
      promises[i].cancel();
    }
    return this;
  };

  /**
   * detach(): Promise
   *
   * Returns the cancellable chain as a classic promise.
   *
   * @method detach
   * @return {Promise} A new promise
   */
  CancellableChain.prototype.detach = function () {
    var promises = this._promises;
    return new Promise(function (resolve, reject, notify) {
      promises[promises.length - 1].then(resolve, reject, notify);
    }, this.cancel.bind(this));
  };

  root.promy.CancellableChain = CancellableChain;

}(this));
