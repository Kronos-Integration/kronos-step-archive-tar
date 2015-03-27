/* jslint node: true, esnext: true */

"use strict";

let http = require('http');
let endpoint = require('./endpoint');
let tar = require('tar-stream');


http.createServer(function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  res.end('Hello World\n');
}).listen(12345, '127.0.0.1');

let extract = tar.extract();

let out1 = endpoint.get('out1');

extract.on('entry', function(header, stream, callback) {

  console.log("got: " + header.name);

  stream.on('end', function() {
    callback(); // ready for next entry
  });

  try {
    out1(header, stream, function(err) {
      if (err) { 
        console.log(err);
        stream.resume();
      }
    });
  } catch (e) {
    console.log(e);
    stream.resume();
  }
});


let in1 = endpoint.get('in1')();


for (let connection of in1) {
  connection.stream.pipe(extract);
}
