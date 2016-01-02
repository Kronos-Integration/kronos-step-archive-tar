/* global describe, it */
/* jslint node: true, esnext: true */

"use strict";

const fs = require('fs'),
	path = require('path'),
	chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	testStep = require('kronos-test-step'),
	endpoint = require('kronos-step').endpoint,
	untar = require('../lib/untar');

const manager = testStep.managerMock;
require('../index').registerWithManager(manager);

describe('untar', function () {
	const tarFileName = path.join(__dirname, 'fixtures/a.tar');

	const names = {};
	let archiveName;
	const tarStep = untar.createInstance(manager, undefined, {
		name: "myStep",
		type: "kronos-untar"
	});

	const testOutEndpoint = new endpoint.SendEndpoint('testOut');
	const testInEndpoint = new endpoint.ReceiveEndpoint('testIn');

	describe('static', function () {
		testStep.checkStepStatic(manager, tarStep);
	});

	describe('live-cycle', function () {
		testStep.checkStepLivecycle(manager, tarStep, function (step, state, livecycle, done) {
			done();
		});
	});

	describe('request', function () {
		describe('start', function () {
			it("should produce a request", function (done) {

				testOutEndpoint.connected = tarStep.endpoints.in;

				let entries = {};
				let request;

				tarStep.start().then(function (step) {
					try {
						assert.equal(tarStep.state, 'running');

						testInEndpoint.receive = request => {
							//console.log(`got request: ${JSON.stringify(request.info)}`);
							entries[request.info.name] = true;
							request.stream.resume();
							return Promise.resolve("OK");
						};

						tarStep.endpoints.out.connect = testInEndpoint;

						const tarStream = fs.createReadStream(tarFileName);
						testOutEndpoint.send({
							info: {
								name: tarFileName
							},
							stream: tarStream
						});

						tarStream.on('end', () => {
							//console.log(`entries: ${JSON.stringify(Object.keys(entries))}`);
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
