// Copyright (c) 2014 Tristan Cavelier <t.cavelier@free.fr>
// This program is free software. It comes without any warranty, to
// the extent permitted by applicable law. You can redistribute it
// and/or modify it under the terms of the Do What The Fuck You Want
// To Public License, Version 2, as published by Sam Hocevar. See
// the COPYING file for more details.

/*jslint indent: 2, maxlen: 80 */
/*global module, test, ok, stop, start, XMLHttpRequest, JSLINT */

(function () {
  "use strict";

  var toLint = [
    "test-jslint.js",

    "promy.js",
    "test-promiseaplus.js",
    "test-extended-promise.js",
    "test-all.js",
    "test-race.js",

    "promisebasedforeach.js",
    "test-promisebasedforeach.js",

    "promisebasedmap.js",
    "test-promisebasedmap.js",

    "promisebasedreduce.js",
    "test-promisebasedreduce.js",

    "range.js",
    "test-range.js",

    "sleep.js",

    "cancellablechain.js",
    "test-cancellablechain.js",

    "promisebasedjsonstringify.js",
    "test-promisebasedjsonstringify.js",

    "promisebasedworker.js",
    "test-promisebasedworker.js"
  ];

  module("JSLINT");

  function jslint(url) {
    test(url, 0, function () {
      stop();
      var xhr = new XMLHttpRequest();
      xhr.onload = function () {
        start();
        JSLINT(xhr.responseText, {});
        var data = JSLINT.data(), i;
        for (i = 0; i < data.errors.length; i += 1) {
          ok(false, url + ":" + data.errors[i].line + ":" +
             data.errors[i].character + ": " + data.errors[i].evidence + "\n" +
             data.errors[i].reason);
        }
      };
      xhr.onerror = function () {
        start();
        ok(false, "Unable to JSLINT");
      };
      xhr.open("GET", url, true);
      xhr.send();
    });
  }

  toLint.forEach(jslint);

}());
