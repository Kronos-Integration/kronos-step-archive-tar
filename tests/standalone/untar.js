/* jslint node: true, esnext: true */

"use strict";

const kronos = require('kronos-service-manager');
const fs = require('fs');
const path = require('path');

const tarFileName = path.join(__dirname,
	'../fixtures/a.tar');

const names = {};
let archiveName;
let tarStream;

const flowDecls = {
	"flow1": {
		"steps": {
			's1': {
				"type": "kronos-untar",
				"endpoints": {
					"in": function (manger, generatorFunction) {
						if (generatorFunction) {
							const generatorObject = generatorFunction();
							generatorObject.next();

							tarStream = fs.createReadStream(tarFileName);

							generatorObject.next({
								info: {
									name: tarFileName
								},
								payload: tarStream
							});
							return;
						}

						const myGen = function* () {
							tarStream = fs.createReadStream(tarFileName);

							yield {
								info: {
									name: tarFileName
								},
								payload: tarStream
							};
						};
						return myGen();
					},
					"out": function (manager) {
						const myGen = function* () {
							do {
								let connection = yield;
								console.log(`name: ${connection.info.name}`);
								names[connection.info.name] = true;
								archiveName = connection.info.archiveName;

								connection.payload.resume();
							} while (true);
						};
						const go = myGen();
						go.next();
						return go;
					}
				}
			}
		}
	}
};

debugger;

const myManager = kronos.manager().then(function (manager) {
	require('../../index').registerWithManager(manager);
	manager.declareFlows(flowDecls);

	const flow1 = manager.flowDefinitions.flow1;
	flow1.initialize(manager);

	// if tar stream eneded we should have consumed all entries
	tarStream.on('end', function () {
		console.log(`${JSON.stringify(names)}`);
	});
});
