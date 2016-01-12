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
	tar = require('../lib/tar');

const manager = testStep.managerMock;
require('../index').registerWithManager(manager);

describe('tar', function () {
	const tarStep = tar.createInstance(manager, undefined, {
		name: "myStep",
		type: "kronos-tar"
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

				testInEndpoint.receive = request =>
					new Promise((fullfilled, rejected) => {
						request.payload.on('end', () => {
							console.log("stream end");
							fullfilled("OK");
						});
						request.payload.resume();
					});

				tarStep.endpoints.out.connected = testInEndpoint;
				tarStep.start().then(function (step) {
					try {
						assert.equal(tarStep.state, 'running');

						let reponse = testOutEndpoint.send({
							info: {
								name: "entry1"
							},
							payload: fs.createReadStream(path.join(__dirname, 'tar_test.js'))
						});

						reponse.then(r => {
							console.log(`A response: ${r}`);
						});

						testOutEndpoint.send({}).then(r => {
							console.log(`B response: ${r}`);
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
