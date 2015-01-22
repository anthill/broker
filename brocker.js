"use strict";


var fsm = require('./fsm.js');





function processRequest(rawCommand) {

  var commandArgs = rawCommand.split(":");

  switch(commandArgs.length) {

    case 0:
      return "Unrecognized command " + rawCommand;
      break;

    case 1:
      var command = commandArgs[0];

      switch(command) {
        case "status":
            return fsm.state;
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
            return "Unrecognized command " + command;
            break;
      }

    case 2:

      switch(commandArgs[0]) {
        case "makeTunnel":
            return fsm.makeTunnel(commandArgs[1]);
            break;
        default:
            return "Unrecognized command " + rawCommand;
            break;

      }
  
  }

}



module.exports = processRequest