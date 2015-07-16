"use strict";

var express = require('express');
var connect = require('connect');
var http = require('http');
var app = express();
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var server = http.createServer(app);
var io = require('socket.io')(server);

app.use("/socket.io.js", express.static(path.join(__dirname, './node_modules/socket.io/node_modules/socket.io-client/socket.io.js')));
app.use("/dygraph-combined.js", express.static(path.join(__dirname, './node_modules/dygraphs/dygraph-combined.js')));

// Monitoring data

var net = require("net");
var clients = {};
var timeout = 5;
var monitorPort = 7000;
var serverPort = 7000;

var eventEmitter = new EventEmitter();

function sendEveryInfos(socket) {
    Object.keys(clients).forEach(function(key) {
	if (clients[key] != undefined && clients[key].log != undefined && clients[key].log.length != 0) {
	    socket.emit('data',
			{cmd: "point",
			 name: getClientName(clients[key]),
			 x: clients[key].log[clients[key].log.length - 1].timestamp,
			 y: 0});
	}
    });
}

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

var monitor = net.createServer(function(socket) {

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
		eventEmitter.emit("connection", clients[socket]);
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
	eventEmitter.emit("disconnection", clients[socket]);
	clearInterval(interval);
	console.log("connection closed");
	delete clients[socket];
    });
});

monitor.listen(monitorPort);

// Sending data to the webpage

io.set('origins', '*:*');

io.on('connection', function(socket) {
    sendEveryInfos(socket);
    eventEmitter.on("connection", function(client) {
	if (client != undefined && client.log != undefined && client.log[client.log.length - 1] != undefined && client.name != undefined) {
	    socket.emit('data', {cmd: "point", name: getClientName(client), x: client.log[client.log.length - 1].timestamp, y: 0});
	    socket.emit('data', {cmd: "point", name: getClientName(client), x: client.log[client.log.length - 1].timestamp, y: 1});
	}
    });

    eventEmitter.on("disconnection", function(client) {
	if (client != undefined && client.log != undefined && client.log[client.log.length - 1] != undefined && client.name != undefined) {
	    socket.emit('data', {cmd: "point", name: getClientName(client), x: client.log[client.log.length - 1].timestamp, y: 1});
	    socket.emit('data', {cmd: "point", name: getClientName(client), x: client.log[client.log.length - 1].timestamp, y: 0});
	}
    });

    console.log("connection");
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var server = server.listen(serverPort, function () {

   var host = server.address().address
   var port = server.address().port

   console.log('Broker listening at http://%s:%s', host, port)

});
