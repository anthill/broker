"use strict";

var express = require('express');
var connect = require('connect');
var http = require('http');
var app = express();
var fs = require("fs");
var processRequest = require('./src/broker.js')
var storeRequest = require('./src/storage.js')

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded());
var path = require('path');
var config = require(path.join(process.cwd(), "config.json"));



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


var server = http.createServer(app);
var io = require('socket.io')(server);

io.set('origins', '*:*');

io.on('connection', function(socket) {

   fs.readFile(config.storage, function(err, data){
      if (err) throw err;
      var lines = data.toString().split("\n").filter(function(line){return line.trim().length > 0});
      lines.forEach(function(line){
         var obj = JSON.parse(line);
         obj.results.forEach(function(result){
            console.log("emitting",result.date, result.signal_strengths.length);
            socket.emit('data', [Date.parse(result.date), parseFloat(result.signal_strengths.length)]);
         })         
      })

   });

   fs.watchFile(config.storage, function (curr, prev) {
      fs.readFile(config.storage, function(err, data){
         if (err) throw err;
         console.log(data.toString());
         var lines = data.toString().split("\n").filter(function(line){return line.trim().length > 0});
         var lastLine = lines[lines.length - 1];
         console.log(lastLine);
         var obj = JSON.parse(lastLine);
         obj.results.forEach(function(result){
            console.log("emitting",result.date, result.signal_strengths.length);
            socket.emit('data', [Date.parse(result.date), parseFloat(result.signal_strengths.length)]);
         })
      });
   });


});

app.use(express.static('./public'));


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var server = server.listen(4000, function () {

   var host = server.address().address
   var port = server.address().port

   console.log('Broker listening at http://%s:%s', host, port)

})

