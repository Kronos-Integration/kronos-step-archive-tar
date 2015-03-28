/* jslint node: true, esnext: true */

"use strict";

let manager = require('service-manager').manager;

let tar = require('../index.js');
var assert = require('assert');

describe('tar service declaration', function () {
  let myManager = manager();
  myManager.declareServices({
    'service1': {
      'endpoints': {
        'in1': function* () {
          yield {
            info: {},
            pipe: process.stdin
          };
        },
        'out1': function (info, stream, cb) {}
      }
    }
  });
  it('declared services should be present', function () {
    let service = tar.createService(myManager, 'service1', {});
    assert(service);
  });
});
