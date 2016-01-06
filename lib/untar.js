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

		const ongoingRequests = new Set();

		properties._start = {
			value: function () {
				const step = this;

				step.endpoints.in.receive = request => {
					return new Promise((fullfilled, rejected) => {
						const current = {
							name: ongoingRequests.size,
							toString() {
								return this.name;
							},
							request: request,
							responses: [],
							extract: tar.extract()
						};
						ongoingRequests.add(current);

						const archiveName = current.request.info.name;

						current.request.stream.pipe(current.extract);

						current.rejected = rejected;

						current.extract.on('finish', () => {
							// our request is done
							fullfilled(Promise.all(current.responses));
							ongoingRequests.delete(current);
						});

						// This will be called from the untar function for each element in the TAR archive
						current.extract.on('entry', function (header, stream, callback) {
							stream.on('end', () => callback());

							header.archiveName = archiveName;
							header.timeout = request.info.timeout;

							try {
								current.responses.push(step.endpoints.out.send({
									info: header,
									stream: stream
								}));
							} catch (e) {
								step.error(e);
								stream.resume();
								rejected(e);
							}
						});
					});
				};

				return Promise.resolve(this);
			}
		};

		properties._stop = {
			value: function () {
				// reject all ongoing requests
				ongoingRequests.forEach(r => {
					r.request.stream.unpipe(r.extract);
					r.rejected();
				});

				return Promise.resolve(this);
			}
		};

		return this;
	}
});
