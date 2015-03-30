/* jslint node: true, esnext: true */

"use strict";

let tar = require('tar-stream');

exports.createService = function (manager, serviceId, serviceConfig) {

  let extract = tar.extract();

  let out1 = manager.getServiceEndpoint(serviceId, 'out1');

  extract.on('entry', function (header, stream, callback) {

    stream.on('end', function () {
      callback(); // ready for next entry
    });

    try {
      out1(header, stream, function (err) {
        if (err) { 
          console.log(err);
          stream.resume();
        }
      });
    } catch (e) {
      console.log(e);
      stream.resume();
    }
  });

  let in1 = manager.getServiceEndpoint(serviceId, 'in1')();

  for (let connection of in1) {
    connection.stream.pipe(extract);
  }

  // TODO live service object ?
  return {};
};
