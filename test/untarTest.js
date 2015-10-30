/* global describe, it */
/* jslint node: true, esnext: true */

"use strict";

const fs = require('fs'),
	events = require('events'),
	scopeReporter = require('scope-reporter'),
	path = require('path'),
	chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	kronosStep = require('kronos-step');

const sr = scopeReporter.createReporter(kronosStep.ScopeDefinitions);

const manager = Object.create(new events.EventEmitter(), {
	steps: {
		value: {
			"kronos-untar": kronosStep.prepareStepForRegistration(require('../lib/untar'))
		}
	}
});

describe('untar', function () {
	const tarFileName = path.join(__dirname, 'fixtures/a.tar');

	const names = {};
	let archiveName;
	const tarStep = kronosStep.createStep(manager, sr, {
		name: "myStep",
		type: "kronos-untar",
		endpoints: {
			"in": kronosStep.createEndpoint('in', {
				direction: "in"
			}),
			"out": kronosStep.createEndpoint('out', {
				direction: "out"
			})
		}
	});

	const testOutEndpoint = kronosStep.createEndpoint('test', {
		direction: "out"
	});

	const testInEndpoint = kronosStep.createEndpoint('test', {
		direction: "in"
	});

	describe('request', function () {
		describe('start', function () {
			it("should produce a request", function (done) {

				testOutEndpoint.setTarget(tarStep.endpoints.in);

				let entries = {};
				let request;

				tarStep.start().then(function (step) {
					try {
						assert.equal(tarStep.state, 'running');

						testInEndpoint.receive(function* () {
							while (true) {
								request = yield;
								//console.log(`got request: ${JSON.stringify(request.info)}`);
								entries[request.info.name] = true;
								request.stream.resume();
							};
						});

						tarStep.endpoints.out.setTarget(testInEndpoint);

						const tarStream = fs.createReadStream(tarFileName);
						testOutEndpoint.send({
							info: {
								name: tarFileName
							},
							stream: tarStream
						});

						tarStream.on('end', function () {
							console.log(`entries: ${JSON.stringify(Object.keys(entries))}`);
							assert.isTrue(entries.file1 && entries.file2 && entries.file3);
							//assert.equal(archiveName, tarFileName);
							done();
						});
					} catch (e) {
						done(e);
					}
				}, done);
			});
		});
	});
});
