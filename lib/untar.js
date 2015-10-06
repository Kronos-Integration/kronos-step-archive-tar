/* jslint node: true, esnext: true */
"use strict";

const tar = require('tar-stream');

module.exports = {
	"name": "kronos-untar",
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
	initialize(manager, sr, stepDefinition, endpoints, properties) {
		let archiveName;

		let extract = tar.extract();
		let currentRequest;

		// This will be called from the untar function for each element in the TAR archive
		extract.on('entry', function (header, stream, callback) {
			stream.on('end', function () {
				callback(); // ready for next entry
			});

			header.archiveName = archiveName;

			try {
				endpoints.out.send({
					info: header,
					stream: stream
				});
			} catch (e) {
				step.error(e);
				stream.resume();
			}
		});

		properties._start = {
			value: function () {
				const step = this;
				endpoints.in.receive(function* () {
					while (step.state === 'running' ||  step.state === 'starting') {
						let currentRequest = yield;

						// set the archive name
						archiveName = request.info.name;

						currentRequest.stream.pipe(extract);
					}
				});
				return Promise.resolve(this);
			}
		};

		properties._stop = {
			value: function () {

				if (currentRequest) {
					currentRequest.stream.unpipe(extract);
					currentRequest = undefined;
				}

				return Promise.resolve(this);
			}
		};
	}
};
