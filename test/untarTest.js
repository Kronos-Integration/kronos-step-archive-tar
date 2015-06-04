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
	let tarStream;

	const flowDecls = {
		"flow1": {
			"steps": {
				's1': {
					"type": "kronos_untar",
					"endpoints": {
						"in": function () {
							return function* () {
								tarStream = fs.createReadStream(name);

								yield {
									info: {
										name: name
									},
									stream: tarStream
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

	it('all entries should be consumed', function (done) {
		const myManager = kronos.manager({
			flows: flowDecls,
			stepDirectories: path.join(__dirname, '..', 'lib')
		}).then(function (manager) {
			const flow1 = manager.flowDefinitions.flow1;
			flow1.initialize(manager);

			// if tar stream eneded we should have consumed all entries
			tarStream.on('end', function () {
				assert(names.file1 && names.file2 && names.file3);
				assert(archiveName === name);
				done();
			});
		});
	});
});
