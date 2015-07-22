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
	port: process.env.INTERNAL_PORT != undefined ? process.env.INTERNAL_PORT : 6000,
	host: process.env.TCP_PORT_5000_TCP_ADDR != undefined ? process.env.TCP_PORT_5000_TCP_ADDR : "127.0.0.1" 
}, function() {
	console.log("Connected");
}
);

client.on('error', function(err) {
	console.log("[ERROR] : " + err.message);
	process.exit(-1);
});


function sendEveryInfos(socket) {
	Object.keys(clients).forEach(function(key) {
		if (clients[key] != undefined && clients[key].log != undefined && clients[key].log.length != 0) {
			clients[key].log.forEach(function(log) {
				console.log("sensor " + clients[key].name + " : " + JSON.stringify(log));
				socket.emit('data', {cmd: "point", name: clients[key].name, x: log.timestamp, y: log.event === "connected" ? 0 : 1});
				socket.emit('data', {cmd: "point", name: clients[key].name, x: log.timestamp, y: log.event === "connected" ? 1 : 0});
			});
		}
	});
}

// Send data to the frontend

io.set('origins', '*:*');

io.on('connection', function(socket) {

	var interval = undefined;
	sendEveryInfos(socket); // Disable to only see new datas on the website
	client.on('data', function(data){

		var client = JSON.parse(data.toString());

		clients[client.data.name] = client.data;

		if (client.type === "connection") {
			socket.emit('data', {cmd: "point", name: client.data.name, x: client.data.log[client.data.log.length - 1].timestamp, y: 0});
			socket.emit('data', {cmd: "point", name: client.data.name, x: client.data.log[client.data.log.length - 1].timestamp, y: 1});

			clearInterval(interval);
			interval = setInterval(function() {socket.emit('data', {cmd: "point", name: client.data.name, x: new Date().getTime(), y: 1})}, 10000);
			
		} else {
			socket.emit('data', {cmd: "point", name: client.data.name, x: client.data.log[client.data.log.length - 1].timestamp, y: 1});
			socket.emit('data', {cmd: "point", name: client.data.name, x: client.data.log[client.data.log.length - 1].timestamp, y: 0});

			clearInterval(interval);
			interval = setInterval(function() {socket.emit('data', {cmd: "point", name: client.data.name, x: new Date().getTime(), y: 0})}, 10000);

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
