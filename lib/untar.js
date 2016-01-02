/* jslint node: true, esnext: true */
"use strict";

const tar = require('tar-stream');

module.exports = Object.assign({}, require('kronos-step').Step, {
	"name": "kronos-untar",
	"description": "decomposes tar archive into individual output requests",
	"endpoints": {
		"in": {
			"in": true
		},
		"out": {
			"out": true
		}
	},
	initialize(manager, scopeReporter, name, stepConfiguration, properties) {
		let archiveName;

		let extract = tar.extract();
		let currentRequest;

		properties._start = {
			value: function () {
				const step = this;

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

				this.endpoints.in.receive = request => {
					currentRequest = request;

					// set the archive name
					archiveName = currentRequest.info.name;

					currentRequest.stream.pipe(extract);
					return Promise.resolve("OK");
				};

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

		return this;
	}
});
