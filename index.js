/* jslint node: true, esnext: true */
"use strict";
exports.registerWithManager = function (manager) {
  manager.registerStepImplementation('kronos-untar', require('./lib/untar'));
  manager.registerStepImplementation('kronos-tar', require('./lib/tar'));
};
