"use strict";

var client = require("./clientModule.js");
var connectInfo = require("./connectInfo.js");

// This is an example of the most basic TCP client possible using the clientModule.js

client.start({host: connectInfo.host, port: connectInfo.port, name: connectInfo.name},
	function(err, client) {
		if (err) {
			console.log("[ERROR] : " + err.message);
		}
	});
