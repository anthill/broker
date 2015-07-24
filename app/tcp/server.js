"use strict";

var EventEmitter = require('events').EventEmitter;


var net = require("net");
var clients = {};
var timeout = 5;
var monitorPort = 5000;
var eventEmitter = new EventEmitter();

function getLastItem(array) {
	if (!array || !array.length)
		return undefined;
	return array[array.length - 1];
} 

function getID(socket) {
	return (socket.remoteAddress + ":" + socket.remotePort);
}

function getClientName(client) {
	return (client == undefined ? undefined : client.name);
}

function detectDeadClient(client) {
	if (client.connected == true) {
		console.log(getClientName(client) + " disconnected");
		client.log.push({timestamp: (new Date()).getTime(), event: "disconnected", network: 0});
		eventEmitter.emit("data", {type: "disconnection", data: client, network: 0});
		client.connected = false;
	}
}

// Receive data from sensors

var monitorIncoming = net.createServer(function(socket) {

	var interval;
	var save;

	clients[getID(socket)] = {name: undefined, log: [], lastMsgDate: 0, connected: false};
	save = {client: clients[getID(socket)], id: getID(socket)};

	// initialize heartbeat
	interval = setInterval(detectDeadClient, timeout * 1000, clients[getID(socket)]);

	socket.on('data', function(data) {

		var network = 1; // network connection (GPRS, EDGE, 3G, 3G+)

		if (clients[getID(socket)] != undefined) {

			if (data.toString().match(/net(\d)/))
				network = parseInt(data.toString().match(/net(\d)/)[1]);
			else if (getLastItem(clients[getID(socket)].log) && getLastItem(clients[getID(socket)].log).network)
				network = getLastItem(clients[getID(socket)].log).network;

			console.log("data received from " + getClientName(clients[getID(socket)]) + ": " + data);

			// client requests
			if (data == "timeout?") {
				socket.write("timeout"+timeout);
			}
			else if (data.toString().match("name=*") && clients[getID(socket)].name == undefined) {
				clients[getID(socket)].name = data.toString().substr(5);
				console.log(socket.remoteAddress + " is now known as " + clients[getID(socket)].name);
				socket.write("nameOK");
			}

			if (clients[getID(socket)].connected == false ||
				getLastItem(clients[getID(socket)].log).network != network) {

				console.log(getClientName(clients[getID(socket)]) + " connected");

				clients[getID(socket)].log.push(
					{timestamp: (new Date()).getTime(), event: "connected", network: network});

				eventEmitter.emit("data",
					{type: "connection", data: clients[getID(socket)], network: network});

				clients[getID(socket)].connected = true;
			}
			clients[getID(socket)].lastMsgDate = (new Date()).getTime();

		// reset heartbeat
		clearInterval(interval);
		interval = setInterval(detectDeadClient, timeout * 1000, clients[getID(socket)]);
	}
});

	// When client close the connection (we use the save here because socket == undefined)
	socket.on('end', function() {
		if (save.client != undefined) {
			save.client.connected = false;
			save.client.log.push({timestamp: (new Date()).getTime(), event: "disconnected", network: 0});
			eventEmitter.emit("data", {type: "disconnection", data: save.client, network: 0});
		}

		clearInterval(interval);
		console.log("connection closed");
		delete clients[save.id];
	});

});

monitorIncoming.on('error', function(err) {
	console.log("[ERROR] : ", err.message);
	if (err.code == "EADDRINUSE") {
		console.log("address in use, please retry later ...");
	}
});

monitorIncoming.listen(monitorPort);

monitorIncoming.on('error', function(err) {
	console.log("[ERROR] : ", err.message);
});

// Send data to the webserver

var monitorOutgoing = net.createServer(function(socket) {

	eventEmitter.on("data", function(data){
		socket.write(JSON.stringify(data));
	});

	socket.on("error", function(err) {
		console.log("[ERROR] : ", err.message);
	});

});

monitorOutgoing.listen(process.env.INTERNAL_PORT != undefined ? process.env.INTERNAL_PORT : 6000);
