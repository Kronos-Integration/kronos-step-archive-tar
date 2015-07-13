/* jslint node: true, esnext: true */
"use strict";

const log4js = require('log4js');
const logger = log4js.getLogger('kronos-step-archive-tar:untar');

const tar = require('tar-stream');

module.exports = {
	"description": "decomposes tar archive into individual output requests",
	"endpoints": {
		"in": {
			"direction": "in(passive)",
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
		logger.debug(`Initialize`);

		let archiveName;

		// --------------------------------------
		// Initialize the OUT endpoint
		// --------------------------------------
		const out = step.endpoints.out.initialize(manager);
		logger.debug(`Initialized the OUT endpoint`);


		// --------------------------------------
		// get the untar function
		// --------------------------------------
		const extract = tar.extract();

		// This will be called from the untar function for each element in the TAR archive
		extract.on('entry', function (header, stream, callback) {
			step.debug(`Extract new entry '${header.name}'`);
			logger.debug(`Extract new entry '${header.name}'`);

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
				logger.error(`Error for archive: '${archiveName}': ${e}`);
				step.error(e);
				stream.resume();
			}
		});

		// --------------------------------------
		// initialize the IN endpoint
		// --------------------------------------
		step.endpoints.in.initialize(manager, function* () {
			logger.debug(`IN': called`);

			const request = yield;
			logger.debug(`Got a new request to untar ${request.info.name}`);

			// set the archive name
			archiveName = request.info.name;
			step.debug(`New archive ${archiveName}`);

			request.stream.pipe(extract);

			logger.debug(`Done archive ${archiveName}`);
		});
		logger.debug(`Initialized the IN endpoint`);
	}
};
