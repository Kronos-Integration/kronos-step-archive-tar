/* jslint node: true, esnext: true */

"use strict";

let manager = require('service-manager').manager;
let tar = require('../index.js');
let fs = require('fs');
let path = require('path');

var assert = require('assert');

describe('tar service declaration', function () {
	let myManager = manager();

	const name = path.join(__dirname,
		'fixtures/a.tar');

	myManager.declareServices({
		'service1': {
			'endpoints': {
				'in1': function* () {
					yield {
						info: {
							name: name
						},
						pipe: fs.createReadStream(name)
					};
				},
				'out1': function (info, stream, cb) {
					console.log(`name: ${info.name}`);
				}
			}
		}
	});
	it('declared services should be present', function () {
		let service = tar.createService(myManager, 'service1', {});
		assert(service);
	});
});
