/* jslint node: true, esnext: true */
"use strict";

const tar = require('tar-stream');

exports.stepImplementations = {
  "kronos_untar": {
    "description": "decomposes tar archive into individual output requests",
    "endpoints": {
      "in": {
        "direction": "in",
        "uti": "public.tar-archive",
        "contentInfo": {
          "name": {
            "description": "The file name of the original tar file",
            "mandatory": false
          }
        }
      },
      "out": {
        "direction": "out",
        "contentInfo": {
          "archiveName": {
            "description": "The file name of the original tar file"
          },
          "name": {
            "description": "The file name of the extratcted entry"
          },
          "mtime": {
            "description": "modification time of the entry"
          }
        }
      }
    },
    initialize(manager, step) {
      step.debug("Initialize");

      const extract = tar.extract();
      const out = step.endpoints.out.implementation();

      let archiveName;

      out.next(); // advance to 1st. connection - TODO: needs to be moved into service-manager

      extract.on('entry', function (header, stream, callback) {
        step.debug(`Extract new entry '${header.name}'`);

        stream.on('end', function () {
          callback(); // ready for next entry
        });

        header.archiveName = archiveName;

        try {
          out.next({
            info: header,
            stream: stream
          });
        } catch (e) {
          step.error(e);
          stream.resume();
        }
      });

      const in1 = step.endpoints.in.implementation();

      for (let request of in1) {
        archiveName = request.info.name;
        step.debug(`New archive ${archiveName}`);

        request.stream.pipe(extract);
      }
    }
  }
};
