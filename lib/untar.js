/* jslint node: true, esnext: true */
"use strict";

const tar = require('tar-stream');

exports.stepImplementations = {
	"kronos_untar": {
		"description": "decomposes tar archive into individual output requests",
		"endpoints": {
			"in": {
				"direction": "in(pull)",
				"uti": "public.tar-archive",
				"contentInfo": {
					"name": {
						"description": "The file name of the original tar file",
						"mandatory": false
					}
				}
			},
			"out": {
				"direction": "out(push)",
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
			const extract = tar.extract();

			let archiveName;

			const out = step.endpoints.out.initialize();

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

			// TODO why ?
			out.next();

			for (let request of step.endpoints.in.initialize()) {
				archiveName = request.info.name;
				step.debug(`New archive ${archiveName}`);

				request.stream.pipe(extract);
			}
		}
	}
};
