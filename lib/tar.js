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

		this.interceptedEndpoints.in.receive = request =>
			new Promise((fullfilled, rejected) => {

				console.log(`request: ${request.stream ? 'entry' : 'end'}`);
				if (request.stream) {
					if (!current) {
						// start a new archive

						// what we need to handle one incoming request
						current = {
							requests: [request],
							pack: tar.pack()
						};

						current.reponse = this.interceptedEndpoints.out.send({
							info: {},
							stream: current.pack
						}, request);
					}

					// append entry
					const entry = current.pack.entry({
						name: request.info.name
					}, err => {
						if (err) {
							this.error(err);

							console.log(`rejected: ${err}`);
							rejected(err);

							if (current) {
								current.pack.finalize();
							}
						}
					});

					request.stream.pipe(entry);
				} else {
					// no stream so probably a separator request -> ready

					if (current) {
						current.pack.finalize();

						console.log(`request: fullfilled`);

						fullfilled(current.response);
						current = undefined;
					}
				}
			});

		return Promise.resolve(this);
	}
});
