/* jslint node: true, esnext: true */
"use strict";

exports.registerWithManager = manager => Promise.all([
  manager.registerStep(require('./lib/untar')),
  manager.registerStep(require('./lib/tar'))
]);
