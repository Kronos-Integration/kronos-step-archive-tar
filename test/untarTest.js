/* global describe, it*/
/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');
const fs = require('fs');
const path = require('path');

const assert = require('assert');

describe('untar', function () {

	const tarFileName = path.join(__dirname, 'fixtures/a.tar');

	const names = {};
	let archiveName;
	let tarStream;

	const flowDecls = {
		"flow1": {
			"steps": {
				's1': {
					"type": "kronos-untar",
					"endpoints": {
						"in": function (manager, generatorFunction) {
							if (generatorFunction) {
								const generatorObject = generatorFunction();
								tarStream = fs.createReadStream(tarFileName);
								generatorObject.next();

								generatorObject.next({
									info: {
										name: tarFileName
									},
									stream: tarStream
								});
								return;
							}

							const myGen = function* () {
								tarStream = fs.createReadStream(tarFileName);

								yield {
									info: {
										name: tarFileName
									},
									stream: tarStream
								};
							};
							return myGen();
						},
						"out": function (manager) {
							const myGen = function* () {
								do {
									let connection = yield;
									//console.log(`name: ${connection.info.name}`);
									names[connection.info.name] = true;
									archiveName = connection.info.archiveName;

									connection.stream.resume();
								} while (true);
							};
							const go = myGen();
							//go.next();
							return go;
						}
					}
				}
			}
		}
	};

	describe('passive in', function () {
		it('all entries should be consumed', function (done) {
			const myManager = kronos.manager().then(function (manager) {
				require('../index').registerWithManager(manager);
				manager.declareFlows(flowDecls);

				const flow1 = manager.flowDefinitions.flow1;
				flow1.initialize(manager);

				// if tar stream ended we should have consumed all entries
				tarStream.on('end', function () {
					assert(names.file1 && names.file2 && names.file3);
					assert(archiveName === tarFileName);
					done();
				});
			});
		});
	});


	describe('active in', function () {
		// TODO don`t know how to enforce active
	});

});
