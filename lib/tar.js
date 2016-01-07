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

	_start() {
		let pack;

		this.interceptedEndpoints.in.receive = request => {
			if (request.stream) {
				if (!pack) {
					pack = tar.pack();
					this.interceptedEndpoints.out.send({
						info: {},
						stream: pack
					});
				}

				const entry = pack.entry({
					name: request.info.name
				}, err => {
					if (err) {
						this.error(err);
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
			return Promise.resolve();
		};

		return Promise.resolve(this);
	}
});
