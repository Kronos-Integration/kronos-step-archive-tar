/* global describe, it, before */
/* jslint node: true, esnext: true */

'use strict';

const fs = require('fs'),
	path = require('path'),
	chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	should = chai.should(),
	testStep = require('kronos-test-step'),
	ksm = require('kronos-service-manager'),
	endpoint = require('kronos-endpoint'),
	tar = require('../lib/tar');

let manager;

before(done => {
	ksm.manager({}, [require('../index')]).then(m => {
		manager = m;
		done();
	});
});

it('tar', () => {
	const tarStep = tar.createInstance({
		name: 'myStep',
		type: 'kronos-tar'
	}, manager);

	describe('static', () => testStep.checkStepStatic(manager, tarStep));

	const testOutEndpoint = new endpoint.SendEndpoint('testOut');
	const testInEndpoint = new endpoint.ReceiveEndpoint('testIn');

	describe('live-cycle', () => {
		testStep.checkStepLivecycle(manager, tarStep, (step, state, livecycle, done) =>
			done());
	});

	describe('request', () => {
		it('should produce a request', done => {
			testOutEndpoint.connected = tarStep.endpoints.in;

			testInEndpoint.receive = request =>
				new Promise((fullfilled, rejected) => {
					request.payload.on('end', () => {
						console.log('stream end');
						fullfilled('OK');
					});
					request.payload.resume();
				});

			tarStep.endpoints.out.connected = testInEndpoint;
			tarStep.start().then(() => {
				try {
					assert.equal(tarStep.state, 'running');

					let reponse = testOutEndpoint.receive({
						info: {
							name: 'entry1'
						},
						payload: fs.createReadStream(path.join(__dirname, 'tar_test.js'))
					});

					reponse.then(r => {
						console.log(`A response: ${r}`);
					});

					testOutEndpoint.receive({}).then(r => {
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
