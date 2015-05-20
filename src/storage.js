"use strict";

var Promise = require('es6-promise').Promise;
var fs = require('fs');
var path = require('path');

var decoder = require('6sense/js/codec/decodeForSMS.js');

var config = require(path.join(process.cwd(), "config.json"));

function storeRequest(message) {

   return new Promise(function(resolve, reject){

      if (config.authorizedNumbers.indexOf(message.From) > -1) {

         decoder(message.Body)
         .then(function(decodedMsg){
            var line = [message.From, JSON.stringify(decodedMsg)].join(",") + "\n";

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