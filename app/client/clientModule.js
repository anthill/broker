"use strict";

var net = require('net');

var client;
var timeout = 60, lastmessage = 0;
var interval;

function heartbeat() {
	console.log("sending heartbeat");
	client.write("*");
}

// Connect to a TCP server and use a heartbeat protocol

function start(connectInfos, callback) {
	client = net.connect(connectInfos,
		function() {
			console.log('connected to the server');

				// ask for the timeout value
				client.write("name=" + connectInfos.name);				
				
				interval = setInterval(heartbeat, (timeout * 1000) / 2);
			});

	client.on('data', function(data) {
		console.log("data received : " + data.toString());

		// get the new timeout value
		if (data.toString().match("timeout*")) {
			timeout = parseInt(data.toString().substr(7));
			clearInterval(interval);
			interval = setInterval(heartbeat, (timeout * 1000) / 2);
			console.log("new timeout set to : " + timeout + " seconds");
			callback(null, client);
		}
		else if (data.toString() == "nameOK") {
			client.write("timeout?");
		}
	});

	client.on('end', function() {
		console.log("server disconnected");
		client.end();
		process.exit();
	});

	client.on('error', function(err){
		callback(err, client);
	});
}

module.exports = {start: start};
