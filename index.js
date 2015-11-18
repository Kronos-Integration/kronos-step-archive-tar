/* jslint node: true, esnext: true */
"use strict";
exports.registerWithManager = function (manager) {
  manager.registerStep(require('./lib/untar'));
  manager.registerStep(require('./lib/tar'));
};
