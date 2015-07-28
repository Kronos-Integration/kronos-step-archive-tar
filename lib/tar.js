/* jslint node: true, esnext: true */
"use strict";

const tar = require('tar-stream');

module.exports = {
	"description": "composes entries into a tar archive",
	"endpoints": {
		"in": {
			"direction": "in(active,passive)",
			"contentInfo": {
				"name": {
					"description": "The name of the entry",
					"mandatory": true
				},
				"mtime": {
					"description": "modification time of the entry",
					"mandatory": false
				}
			}
		},
		"out": {
			"direction": "out(active)",
			"uti": "public.tar-archive",
		}
	},
	initialize(manager, step) {
		const out = step.endpoints.out.initialize(manager);

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
			const iterator = step.endpoints.in.initialize(manager);
			for (let request of iterator) {
				processRequest(request);
			}
		} else {
			step.endpoints.in.initialize(manager, function* () {
				do {
					const request = yield;
					processRequest(request);
				} while (true);
			});
		}
	}
};
