"use strict";


var fsm = require('./fsm.js');





function processRequest(command) {

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
      default:
          return "Unrecognized command " + command
  }

}



module.exports = processRequest