"use strict";

var express = require('express');
var connect = require('connect');
var app = express();

var processRequest = require('./broker.js')

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
   };
});


var server = app.listen(3000, function () {

   var host = server.address().address
   var port = server.address().port

   console.log('Broker listening at http://%s:%s', host, port)

})

