/* jslint node: true, esnext: true */

"use strict";

let manager = require('service-manager').manager;
let tar = require('../index.js');
let fs = require('fs');
let path = require('path');

var assert = require('assert');

describe('tar service declaration', function () {
  let myManager = manager();

  const name = path.join(__dirname,
    'fixtures/a.tar');

  myManager.declareFlow({
    "name": "flow1",
    "steps": {
      's1': {
        'endpoints': {
          'in': function* () {
            yield {
              info: {
                name: name
              },
              stream: fs.createReadStream(name)
            };
          },
          'out': function* () {
            do {
              let connection =
                yield;
              console.log(`name: ${connection.info.name}`);
              connection.stream.resume();
            } while (true);
          }
        }
      }
    }
  });
  it('services should be present', function () {
    let step = myManager.getFlow('flow1').steps.s1;
    tar.initializeStep(myManager, step);
    assert(step);
  });
});
