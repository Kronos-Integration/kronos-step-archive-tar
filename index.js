exports.registerWithManager = function(manager) {
  manager.registerStepImplementation('kronos-untar',require('./lib/untar'));
  manager.registerStepImplementation('kronos-tar',require('./lib/tar'));
};
