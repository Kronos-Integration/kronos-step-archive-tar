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
	BaseStep = require('kronos-step'),
	tar = require('../lib/tar');

const manager = testStep.managerMock;
require('../index').registerWithManager(manager);

describe('tar', function () {
	const tarStep = tar.createInstance(manager, undefined, {
		name: "myStep",
		type: "kronos-tar"
	});

	const testOutEndpoint = BaseStep.createEndpoint('testOut', {
		out: true,
		active: true
	});

	const testInEndpoint = BaseStep.createEndpoint('testIn', { in : true,
		passive: true
	});

	describe('request', function () {
		describe('start', function () {
			it("should produce a request", function (done) {
				testOutEndpoint.connect(tarStep.endpoints.in);

				let request;

				testInEndpoint.receive(function* () {
					while (true) {
						request = yield;
						console.log(`got request: ${JSON.stringify(request.info)}`);
						request.stream.resume();
					};
				});

				tarStep.endpoints.out.connect(testInEndpoint);

				tarStep.start().then(function (step) {
					try {
						assert.equal(tarStep.state, 'running');

						const inputStream = fs.createReadStream(path.join(__dirname, 'tarTest.js'));
						testOutEndpoint.send({
							info: {
								name: "entry1"
							},
							stream: inputStream
						});

						inputStream.on('end', function () {
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
