/* jslint node: true, esnext: true */
"use strict";

const tar = require('tar-stream');

module.exports = {
	"description": "composes entries into a tar archive",
	"endpoints": {
		"in": {
			"direction": "in(passive)",
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

		step.endpoints.in.initialize(manager, function* () {
		});
	}
};
