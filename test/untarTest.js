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

	const testOutEndpoint = BaseStep.createEndpoint('testOut', {
		out: true,
		active: true,
	});

	const testInEndpoint = BaseStep.createEndpoint('testIn', { in : true,
		passive: true
	});

	describe('request', function () {
		describe('start', function () {
			it("should produce a request", function (done) {
				testOutEndpoint.connect(tarStep.endpoints.in);

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

						tarStep.endpoints.out.connect(testInEndpoint);

						const tarStream = fs.createReadStream(tarFileName);
						testOutEndpoint.send({
							info: {
								name: tarFileName
							},
							stream: tarStream
						});

						tarStream.on('end', function () {
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
