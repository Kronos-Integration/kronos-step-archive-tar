/* jslint node: true, esnext: true */
"use strict";

const tar = require('tar-stream');

module.exports = Object.assign({}, require('kronos-step').Step, {
	"name": "kronos-tar",
	"description": "composes entries into a tar archive",
	"endpoints": {
		"in": {
			"in": true
		},
		"out": {
			"out": true
		}
	},
	initialize(manager, scopeReporter, name, stepConfiguration, properties) {

		properties._start = {
			value: function () {
				const step = this;
				const out = this.endpoints.out;
				let pack;

				this.endpoints.in.receive = request => {
					if (request.stream) {
						if (!pack) {
							pack = tar.pack();
							out.send({
								info: {},
								stream: pack
							});
						}

						const entry = pack.entry({
							name: request.info.name
						}, err => {
							if (err) {
								step.error(err);
								pack.finalize();
							}
						});

						request.stream.pipe(entry);
					} else {
						if (pack) {
							pack.finalize();
							pack = undefined;
						}
					}
					return Promise.resolve("OK");
				};

				return Promise.resolve(this);
			}
		}
	}
});
