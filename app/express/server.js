"use strict";

var net = require("net");
var express = require('express');
var connect = require('connect');
var http = require('http');
var app = express();
var path = require('path');
var server = http.createServer(app);
var io = require('socket.io')(server);

var clients = {};

app.use("/socket.io.js", express.static(path.join(__dirname, '../node_modules/socket.io/node_modules/socket.io-client/socket.io.js')));
app.use("/dygraph-combined.js", express.static(path.join(__dirname, '../node_modules/dygraphs/dygraph-combined.js')));

var serverPort = 7000;

console.log("======", process.env.TCP_PORT_5000_TCP_ADDR, process.env.TCP_PORT_5000_TCP_PORT, "======");

// Get data from the TCP server

var client = net.connect(
{
	port: process.env.INTERNAL_PORT, 
	host: process.env.TCP_PORT_5000_TCP_ADDR 
}, function() {
	console.log("Connected");
}
);

client.on('error', function(err) {
	console.log("[ERROR] : " + err.message);
	process.exit(-1);
});



function sendEveryInfos(socket) {
	console.log("sending every infos");
	Object.keys(clients).forEach(function(key) {
		if (clients[key] != undefined && clients[key].log != undefined && clients[key].log.length != 0) {
			console.log("sending " + clients[key].name + " infos");
			clients[key].log.forEach(function(log) {
				console.log("sensor " + clients[key].name + " : " + JSON.stringify(log));
				socket.emit('data',
				{
					cmd: "point",
					name: clients[key].name,
					x: log.timestamp,
					y: 0
				});
			});
		}
	});
}


// Send data to the frontend

io.set('origins', '*:*');

io.on('connection', function(socket) {

	sendEveryInfos(socket); // Disable to only see new datas on the website
	client.on('data', function(data){

		var client = JSON.parse(data.toString());

		clients[client.data.name] = client.data;
		console.log("data received : " + JSON.stringify(client));

		if (client.type === "connection") {
			socket.emit('data', {cmd: "point", name: client.data.name, x: client.data.log[client.data.log.length - 1].timestamp, y: 0});
			socket.emit('data', {cmd: "point", name: client.data.name, x: client.data.log[client.data.log.length - 1].timestamp, y: 1});
		} else {
			socket.emit('data', {cmd: "point", name: client.data.name, x: client.data.log[client.data.log.length - 1].timestamp, y: 1});
			socket.emit('data', {cmd: "point", name: client.data.name, x: client.data.log[client.data.log.length - 1].timestamp, y: 0});
		}
	})
	
	console.log("web connection");
});

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

var server = server.listen(serverPort, function () {
	
	var host = server.address().address
	var port = server.address().port
	
	console.log('Broker listening at http://%s:%s', host, port)
	
});
