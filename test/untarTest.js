/* global describe, it*/
/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');
const fs = require('fs');
const path = require('path');

const assert = require('assert');

describe('untar service declaration', function () {

	const name = path.join(__dirname,
		'fixtures/a.tar');

	const names = {};
	let archiveName;

	const flowDecls = {
		"flow1": {
			"steps": {
				's1': {
					"type": "kronos_untar",
					"endpoints": {
						"in": function () {
							return function* () {
								yield {
									info: {
										name: name
									},
									stream: fs.createReadStream(name)
								};
							};
						},
						"out": function () {
							return function* () {
								do {
									let connection =
										yield;
									//console.log(`name: ${connection.info.name}`);
									names[connection.info.name] = true;
									archiveName = connection.info.archiveName;

									connection.stream.resume();
								} while (true);
							};
						}
					}
				}
			}
		}
	};

	it('content should be processed', function (done) {
		const myManager = kronos.manager({
			flows: flowDecls,
			stepDirectories: path.join(__dirname, '..', 'lib')
		}).then(function (manager) {
			const flow1 = manager.flowDefinitions.flow1;
			flow1.initialize(manager);

			// TODO how to know when input is completly processed ?
			setTimeout(function () {
				//console.log(`names: ${JSON.stringify(names)}`);

				assert(names.file1 && names.file2 && names.file3);
				assert(archiveName === name);
				done();
			}, 100);
		});
	});
});
