/* jslint node: true, esnext: true */

"use strict";

let serviceManger = require('service-manager');
let tar = require('../index.js');
let fs = require('fs');
let path = require('path');

var assert = require('assert');

serviceManger.stepImplementation.register(tar.stepImplementations);

describe('tar service declaration', function () {
  let myManager = serviceManger.manager();

  const name = path.join(__dirname,
    'fixtures/a.tar');

  const names = {};

  myManager.declareFlow({
    "name": "flow1",
    "steps": {
      's1': {
        "type": "untar",
        "endpoints": {
          "in": function* () {
            yield {
              info: {
                name: name
              },
              stream: fs.createReadStream(name)
            };
          },
          "out": function* () {
            do {
              let connection =
                yield;
              //console.log(`name: ${connection.info.name}`);
              names[connection.info.name] = true;
              connection.stream.resume();
            } while (true);
          }
        }
      }
    }
  });

  it('content should be processed', function (done) {
    let step = myManager.getFlow('flow1').steps.s1;
    tar.stepImplementations.untar.initialize(myManager, step);

    // TODO how to know when input is completly processed ?
    setTimeout(function () {
      assert(names.file1 && names.file2 && names.file3);
      done();
    }, 10);
  });
});
