/* jslint node: true, esnext: true */
"use strict";

const tar = require('tar-stream');

module.exports = Object.assign({}, require('kronos-step').Step, {
	"name": "kronos-tar",
	"description": "composes entries into a tar archive",
	"endpoints": {
		"in": {
			"in": true,
			"passive": true,
			"uti": "org.kronos.file"
		},
		"out": {
			"out": true,
			"active": true,
			"uti": "public.tar-archive"
		}
	},
	initialize(manager, scopeReporter, name, stepConfiguration, endpoints, properties) {
		const out = endpoints.out;

		properties._start = {
			value: function () {
				let pack;

				function processRequest(request) {
					if (request.stream) {
						const entry = pack.entry({
							name: request.info.name
						}, function (err) {
							if (err) {
								step.error(e);
								pack.finalize();
							}
						});

						request.stream.pipe(entry);
					} else {
						prepareNewTar();
					}
				}

				function prepareNewTar() {
					if (pack) {
						pack.finalize();
					}
					pack = tar.pack();

					out.next({
						info: {},
						stream: pack
					});
				}

				prepareNewTar();

				if (step.endpoints.in.isActive) {
					const iterator = endpoints.in;
					for (let request of iterator) {
						processRequest(request);
					}
				} else {
					endpoints.in.initialize(manager, function* () {
						do {
							const request = yield;
							processRequest(request);
						} while (true);
					});
				}
			}
		}
	}
});
