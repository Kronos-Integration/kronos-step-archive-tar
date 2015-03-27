/* jslint node: true, esnext: true */

"use strict";

let manager = require('service-manager');
let tar = require('../index.js');

manager.declareEndpoints({
  'service1': {
    'in1': 'stdin',
    'out1': function (info, stream, cb) {}
  },
});

let service = tar.createService(manager, 'service1', {});

// service.shutdown();
