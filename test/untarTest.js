/* global describe, it*/
/* jslint node: true, esnext: true */

"use strict";

const serviceManger = require('kronos-service-manager');
const untar = require('../lib/untar');
const fs = require('fs');
const path = require('path');

var assert = require('assert');

serviceManger.stepImplementation.register(untar.stepImplementations);

describe('untar service declaration', function () {
	const myManager = serviceManger.manager();

	const name = path.join(__dirname,
		'fixtures/a.untar');

	const names = {};
	let archiveName;

	myManager.declareFlows({
		"flow1": {
			"steps": {
				's1': {
					"type": "ununtar",
					"endpoints": {
						"in": function* () {
							yield {
								info: {
									name: name
								},
								stream: fs.createReadStream(name)
							};
						},
						"out": function* () {
							do {
								let connection =
									yield;
								//console.log(`name: ${connection.info.name}`);
								names[connection.info.name] = true;
								archiveName = connection.info.archiveName;

								connection.stream.resume();
							} while (true);
						}
					}
				}
			}
		}
	});

	it('content should be processed', function (done) {
		const step = myManager.getFlow('flow1').steps.s1;
		untar.stepImplementations.ununtar.initialize(myManager, step);

		// TODO how to know when input is completly processed ?
		setTimeout(function () {
			assert(names.file1 && names.file2 && names.file3);
			assert(archiveName === name);
			done();
		}, 10);
	});
});
