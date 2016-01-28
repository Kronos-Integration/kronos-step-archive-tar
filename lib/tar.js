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
		let current;

		this.endpoints.in.receive = request =>
			new Promise((fullfilled, rejected) => {
				if (request.payload) {
					if (!current) {
						// start a new archive

						// what we need to handle one incoming request
						current = {
							requests: [request],
							pack: tar.pack()
						};

						current.reponse = this.endpoints.out.receive({
							info: {},
							payload: current.pack
						}, request);
					}

					// append entry
					const entry = current.pack.entry({
						name: request.info.name
					}, err => {
						if (err) {
							this.error(err);
							rejected(err);

							if (current) {
								current.pack.finalize();
							}
						}
					});

					request.payload.pipe(entry);
				} else {
					// no stream so probably a separator request -> ready

					if (current) {
						current.pack.finalize();
						fullfilled(current.response);
						current = undefined;
					}
				}
			});

		return Promise.resolve();
	}
});
