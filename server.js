"use strict";

var express = require('express');
var connect = require('connect');
var app = express();

var processRequest = require('./src/broker.js')
var storeRequest = require('./src/storage.js')

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded());


app.post('/', function(req, res) {
   console.log(req.body);

   if (req.body.command !== undefined){
      processRequest(req.body.command)
         .then(function(msg){
            res.json(msg);
         })
         .catch(function(msg){
            res.json(msg);
         });
   } else if (req.body.Body !== undefined){
      storeRequest(req.body)
         .then(function(msg){
            console.log("Storage SUCCESS");
            res.json("OK");
         })
         .catch(function(msg){
            console.log("Storage FAILURE: " + msg);
            res.json("FAIL");
         });
   }
});


var server = app.listen(4000, function () {

   var host = server.address().address
   var port = server.address().port

   console.log('Broker listening at http://%s:%s', host, port)

})

