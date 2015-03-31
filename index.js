/* jslint node: true, esnext: true */

"use strict";

let tar = require('tar-stream');

exports.createService = function (manager, serviceId, serviceConfig) {

	let extract = tar.extract();

	let out1 = manager.getServiceEndpoint(serviceId, 'out1')();
	out1.next(); // advance to 1st. connection - TODO: needs to be moved into service-manager

	extract.on('entry', function (header, stream, callback) {
		stream.on('end', function () {
			callback(); // ready for next entry
		});

		try {
			out1.next({
				info: header,
				stream: stream
			});
		} catch (e) {
			console.log(e);
			stream.resume();
		}
	});

	let in1 = manager.getServiceEndpoint(serviceId, 'in1')();

	for (let request of in1) {
		// TODO request.info is ignored here is someone interested in ?
		request.stream.pipe(extract);
	}

	// TODO live service object ?
	return {};
};
