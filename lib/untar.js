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

		let current;

		properties._start = {
			value: function () {
				const step = this;

				step.endpoints.in.receive = request => {
					current = { 
						request: request
					};

					let responses = [];

					// set the archive name
					archiveName = current.request.info.name;

					current.request.stream.pipe(extract);

					return new Promise((fullfilled, rejected) => {

						current.rejected = rejected;

						extract.on('finish', function () {
							fullfilled(Promise.all(responses));
						});

						// This will be called from the untar function for each element in the TAR archive
						extract.on('entry', function (header, stream, callback) {
							stream.on('end', function () {
								callback(); // ready for next entry
							});

							header.archiveName = archiveName;

							try {
								responses.push(step.endpoints.out.send({
									info: header,
									stream: stream
								}));
							} catch (e) {
								step.error(e);
								stream.resume();
							}
						});
					});
				};

				return Promise.resolve(this);
			}
		};

		properties._stop = {
			value: function () {
				if (current) {
					current.request.stream.unpipe(extract);
					current.rejected();
					current = undefined;
				}

				return Promise.resolve(this);
			}
		};

		return this;
	}
});
