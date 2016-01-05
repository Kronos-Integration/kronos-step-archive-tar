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

	const tarStep = untar.createInstance(manager, undefined, {
		name: "myStep",
		type: "kronos-untar"
	});

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
				const testOutEndpoint = new endpoint.SendEndpoint('testOut');
				const testInEndpoint = new endpoint.ReceiveEndpoint('testIn');

				tarStep.endpoints.out.connected = testInEndpoint;
				testOutEndpoint.connected = tarStep.endpoints.in;

				testInEndpoint.receive = request => {
					request.stream.resume();
					return Promise.resolve(request.info.name);
				};

				tarStep.start().then(function (step) {
					try {
						assert.equal(tarStep.state, 'running');

						const tarStream = fs.createReadStream(tarFileName);

						testOutEndpoint.send({
							info: {
								name: tarFileName
							},
							stream: tarStream
						}).then(result => {
							console.log(`Result: ${result}`);

							assert.deepEqual(result, ['file1', 'file2', 'file3']);
							done();
						}).catch(done);
					} catch (e) {
						done(e);
					}
				}, done);
			});
		});
	});
});
