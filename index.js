/* jslint node: true, esnext: true */

"use strict";

let tar = require('tar-stream');

exports.stepImplementations = {
  "untar": {
    "description": "decomposes tar archive into individual output requests",
    "endpoints": {
      "in": {
        "direction": "in",
        "uti": "public.tar-archive"
      },
      "out": {
        "direction": "out"
      }
    },
    "initialize": function (manager, step) {
      const extract = tar.extract();
      const out = step.endpoints.out.implementation();

      out.next(); // advance to 1st. connection - TODO: needs to be moved into service-manager

      extract.on('entry', function (header, stream, callback) {
        stream.on('end', function () {
          callback(); // ready for next entry
        });

        try {
          out.next({
            info: header,
            stream: stream
          });
        } catch (e) {
          console.log(e);
          stream.resume();
        }
      });

      const in1 = step.endpoints.in.implementation();

      for (let request of in1) {
        // TODO request.info is ignored here, is someone interested in ?
        request.stream.pipe(extract);
      }
    }
  }
};
