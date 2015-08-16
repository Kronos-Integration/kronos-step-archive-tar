/* jslint node: true, esnext: true */
"use strict";

const log4js = require('log4js');
const logger = log4js.getLogger('kronos-step-archive-tar');
logger.setLevel(log4js.levels.ERROR);

const tar = require('tar-stream');

module.exports = {
	"description": "decomposes tar archive into individual output requests",
	"endpoints": {
		"in": {
			"direction": "in(active,passive)",
			"uti": "public.tar-archive",
			"contentInfo": {
				"name": {
					"description": "The file name of the original tar file",
					"mandatory": false
				}
			}
		},
		"out": {
			"direction": "out(active)",
			"uti": "org.kronos.file",
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
		let archiveName;

		// --------------------------------------
		// Initialize the OUT endpoint
		// --------------------------------------
		const out = step.endpoints.out.initialize(manager);

		// --------------------------------------
		// get the untar function
		// --------------------------------------
		const extract = tar.extract();

		// This will be called from the untar function for each element in the TAR archive
		extract.on('entry', function (header, stream, callback) {

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

		// --------------------------------------
		// initialize the IN endpoint
		// --------------------------------------
		if (step.endpoints.in.isActive) {
			const iterator = step.endpoints.in.initialize(manager);
			for (let request of iterator) {
				// set the archive name
				archiveName = request.info.name;

				request.stream.pipe(extract);
			}
		} else {
			step.endpoints.in.initialize(manager, function* () {
				const request = yield;

				//console.log(`Passive got tar stream: ${JSON.stringify(request.info)}`);

				// set the archive name
				archiveName = request.info.name;
				step.debug(`New archive ${archiveName}`);

				request.stream.pipe(extract);
			});
			logger.debug(`Initialized the IN endpoint Passive`);
		}
	}
};
