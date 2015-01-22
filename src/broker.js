"use strict";


var fsm = require('./fsm.js');
var Promise = require('es6-promise').Promise;
var path = require('path');
var config = require(path.join(process.cwd(), "config.json"));

function processRequest(rawCommand) {

  var commandArgs = rawCommand.split(":");

  switch(commandArgs.length) {

    case 0:

      return "Unrecognized command " + rawCommand;
      break;

    case 1:
      // command with no parameter
      var command = commandArgs[0];

      switch(command) {
        case "status":
            return new Promise(function(resolve, reject){
              resolve(fsm.state);
            });
            break;
        case "connect3G":
            return fsm.connect3G();
            break;
        case "disconnect3G":
            return fsm.disconnect3G();
            break;
        case "cleanConnexion":
            return fsm.cleanConnexion();
            break;
        case "cleanTunnel":
            return fsm.cleanTunnel();
            break;
        default:
            return new Promise(function(resolve, reject){
              reject("Unrecognized command " + command);
            });
      }

    case 2:
      // command with one parameter
      switch(commandArgs[0]) {
        case "makeTunnel":
            return fsm.makeTunnel(commandArgs[1]);
            break;
        default:
          return new Promise(function(resolve, reject){
              reject("Unrecognized command " + rawCommand);
            });
      }

    case 3:
      // command with 2 parameters
      switch(commandArgs[0]) {
        case "send":
            var number = commandArgs[2] !== "" ? commandArgs[2] : config.twillio;
            return fsm.sendMessage(commandArgs[1], number);
            break;
        default:
          return new Promise(function(resolve, reject){
              reject("Unrecognized command " + rawCommand);
            });
      }
  
  }

}



module.exports = processRequest