/* jslint node: true, esnext: true */
"use strict";
exports.registerWithManager = function (manager) {
  manager.registerStepImplementation(require('./lib/untar'));
  manager.registerStepImplementation(require('./lib/tar'));
};
