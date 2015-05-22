"use strict";

var Promise = require('es6-promise').Promise;
var fs = require('fs');
var path = require('path');

var decoder = require('6sense/js/codec/decodeFromSMS.js');

var config = require(path.join(process.cwd(), "config.json"));

function storeRequest(message) {

   return new Promise(function(resolve, reject){

      if (config.authorizedNumbers.indexOf(message.From) > -1) {

         decoder(message.Body)
         .then(function(decodedMsg){
            var line = JSON.stringify({sender : message.From, results: decodedMsg}) + "\n";
            console.log("append to storage", line);
            fs.appendFile(config.storage, line, function(err) {
               if(err) {
                  console.log(err);
                  reject(err);
               } else {
                  resolve("SUCCESS");              
               }
            });
         })

         

      } else {
         reject("Unauthorized number:" + message.From);
      };

   });

}



module.exports = storeRequest;