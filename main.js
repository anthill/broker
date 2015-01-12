"use strict";

var express = require('express');
var connect = require('connect');
var app = express();

var processRequest = require('./brocker.js')

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded());


app.post('/', function(req, res) {
	console.log(req.body.command);
    var result = processRequest(req.body.command);
    res.json(result);
});


var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Broker listening at http://%s:%s', host, port)

})

