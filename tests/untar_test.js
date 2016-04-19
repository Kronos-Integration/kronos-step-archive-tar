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
	untar = require('../lib/untar');

let manager;

before(done => {
	ksm.manager({}, [require('../index')]).then(m => {
		manager = m;
		done();
	});
});


it('untar', () => {
	const tarFileName = path.join(__dirname, 'fixtures/a.tar');

	const tarStep = untar.createInstance({
		name: 'myStep',
		type: 'kronos-untar'
	}, manager);

	describe('static', () => testStep.checkStepStatic(manager, tarStep));

	describe('live-cycle', () => {
		testStep.checkStepLivecycle(manager, tarStep, (step, state, livecycle, done) =>
			done());
	});

	describe('requests', () => {
		const testOutEndpoint = new endpoint.SendEndpoint('testOut');
		const testInEndpoint = new endpoint.ReceiveEndpoint('testIn');

		tarStep.endpoints.out.connected = testInEndpoint;
		testOutEndpoint.connected = tarStep.endpoints.in;

		testInEndpoint.receive = (request, beforeRequest) => {
			request.payload.resume();

			return new Promise((fullfilled, rejected) => {
				//console.log(`${request.info.timeout} ${request.info.name}`);
				setTimeout(() => fullfilled(request.info.name), beforeRequest.info.timeout);
			});
		};

		it('should produce requests', done => {
			tarStep.start().then(step => {
				try {
					assert.equal(tarStep.state, 'running');

					const REQUESTS = 10;

					for (let i = 0; i < REQUESTS; i++) {
						const tarStream = fs.createReadStream(tarFileName);

						testOutEndpoint.receive({
							info: {
								timeout: i === REQUESTS - 1 ? 500 : i % 2 === 0 ? 50 : 10
							},
							payload: tarStream
						}).then(result => {
							console.log(`${i} Result: ${result}`);

							assert.deepEqual(result, ['file1', 'file2', 'file3']);

							if (i === REQUESTS - 1) {
								done();
							}
						}).catch(done);
					}

				} catch (e) {
					done(e);
				}
			}, done);
		});
	});
});
