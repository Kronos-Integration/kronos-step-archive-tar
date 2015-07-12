exports.registerWithManager = function(manager) {
  manager.registerStepImplementation('kronos_untar',require('./lib/untar'));
};
