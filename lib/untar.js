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
	initialize(manager, scopeReporter, name, conf, properties) {

		const ongoingRequests = new Set();

		properties._start = {
			value: function () {
				const step = this;

				step.interceptedEndpoints.in.receive = request => {
					return new Promise((fullfilled, rejected) => {

						// what we need to handle one incoming request
						const current = {
							request: request,
							responses: [],
							extract: tar.extract()
						};

						ongoingRequests.add(current);

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

							try {
								current.responses.push(step.interceptedEndpoints.out.send({
									info: header,
									stream: stream
								}, request));
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

				ongoingRequests.clear();

				return Promise.resolve(this);
			}
		};

		return this;
	}
});
