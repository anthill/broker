/*
	This is the client used for 6element (it won't start without quipu)
*/

var quipu = require("./index.js");
var PIN = require("./myPINcode.js");
var tcpClient = require("./tcpClient/clientModule.js");
var connectInfo = require("./tcpClient/connectInfo.js");

var devices = {
	modem: "/dev/serial/by-id/usb-HUAWEI_HUAWEI_HiLink-if00-port0",
	sms: "/dev/serial/by-id/usb-HUAWEI_HUAWEI_HiLink-if02-port0"
};

// Transform a networkType (as returned by AT^SYSINFO) in a sendable data

function getSendableType(type) {
	if (type === undefined || type < 2)
		return "0";	// No internet
	if (type == 2)
		return "1";	// GPRS
	if (type == 3)
		return "2";	// EDGE
	if (type == 4)
		return "3";	// 3G
	if (type > 4)
		return "4";	// 3G+ or better
	return "0";
}

quipu.handle("initialize", devices, PIN);

quipu.on("transition", function (data) {
	console.log("Transitioned from " + data.fromState + " to " + data.toState);
	if (data.fromState == "uninitialized" && data.toState == "initialized") {

		console.log("quipu initialized");
		console.log("opening 3G");
		quipu.handle("open3G");
	}
	else if (data.fromState == "initialized" && data.toState == "3G_connected") {
		console.log("3G initialized");

		tcpClient.start({host: connectInfo.host, port: connectInfo.port, name: connectInfo.name},
		function(err, client) {
			if (err) {
				console.log("[ERROR] : " + err.message);
			}
		});

		quipu.askNetworkType();

		setInterval(function() {
			quipu.askNetworkType();
			tcpClient.setHeartbeatMessage("net" + getSendableType(quipu.getNetworkType()));
		}, tcpClient.timeout < 20 ? tcpClient.timeout * 1000 / 2 : 10000);

	}
});

quipu.on("smsReceived", function(sms) {
	console.log("SMS received : \"" + sms.body + "\" " + "from \"" + sms.from + "\"");
});

quipu.on("3G_error", function() {
	console.log("exiting");
	process.exit(-1);
});
