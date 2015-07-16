"use strict";

var EventEmitter = require('events').EventEmitter;


var net = require("net");
var clients = {};
var timeout = 5;
var monitorPort = 7000;
var eventEmitter = new EventEmitter();


function getClientName(client) {
    if (client == undefined || client.socket == undefined) {
	return (undefined);
    }
    else if (client.name == "unknown") {
	return (client.socket.remoteAddress);
    }
    else {
	return (client.name);
    }
}

function detectDeadClient(client) {
    if (client.connected == true) {
	console.log(getClientName(client) + " disconnected");
	client.log.push({timestamp: (new Date()).getTime(), event: "disconnected"});
	eventEmitter.emit("disconnection", client);
	client.connected = false;
    }
}
var monitorOutgoing = net.createServer(function(socket) {

	eventEmitter.on("data", function(data){
		socket.write(JSON.stringify(data));
	});

});

monitorOutgoing.listen(process.env.INTERNAL_PORT);

var monitorIncoming = net.createServer(function(socket) {

    var interval;

    clients[socket] = {name: undefined, socket: socket, log: [], lastMsgDate: 0, connected: false};

    // initialize heartbeat
    interval = setInterval(detectDeadClient, timeout * 1000, clients[socket]);

    socket.on('data', function(data) {
	if (clients[socket] != undefined) {
	    console.log("data received from " + getClientName(clients[socket]) + ": " + data);
	    
	    // client requests
	    if (data == "timeout?") {
		socket.write("timeout"+timeout);
	    }
	    else if (data.toString().match("name=*") && clients[socket].name == undefined) {
		clients[socket].name = data.toString().substr(5);
		console.log(socket.remoteAddress + " is now known as " + clients[socket].name);
	    }
	    
	    if (clients[socket].connected == false) {
		console.log(getClientName(clients[socket]) + " connected");
		clients[socket].log.push({timestamp: (new Date()).getTime(), event: "connected"});
		eventEmitter.emit("data", {type: "connection", data: clients[socket]});
		clients[socket].connected = true;
	    }
	    clients[socket].lastMsgDate = (new Date()).getTime();
	    
	    // reset heartbeat
	    clearInterval(interval);
	    interval = setInterval(detectDeadClient, timeout * 1000, clients[socket]);
	}
    });

    socket.on('end', function() {
	clients[socket].log.push({timestamp: (new Date()).getTime(), event: "disconnected"});
	eventEmitter.emit("data", {type: "disconnection", data: clients[socket]});
	clearInterval(interval);
	console.log("connection closed");
	delete clients[socket];
    });
});

monitorIncoming.listen(monitorPort);