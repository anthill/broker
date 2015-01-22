"use strict";

var Promise = require('es6-promise').Promise;
var fs = require('fs');
var path = require('path');
var config = require(path.join(process.cwd(), "config.json"));

function storeRequest(message) {

   return new Promise(function(resolve, reject){

      var line = [message.SmsSid, message.From, message.Body].join(",") + "\n";

      fs.writeFile(config.storage, line, function(err) {
         if(err) {
            console.log(err);
            reject(err);
         } else {
            resolve("SUCESS");              
         }
      });


   })

}



module.exports = storeRequest