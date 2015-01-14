"use strict";

var machina = require('machina');
var spawn = require('child_process').spawn;
var kill = require('tree-kill');


var fsm = new machina.Fsm({

    wvdialPid: null,

    connect3G: function() {
        this.wvdialPid = runCommand("wvdial", ["3G"]);
        if (this.wvdialPid !== null){
            this.transition( "3G_connected" );
        };
        console.log(this.wvdialPid);
    },

    disconnect3G: function() {
        console.log("killing process", this.wvdialPid);
        kill(this.wvdialPid, 'SIGKILL');
        this.transition( "3G_disconnected" );
    },


    initialState: "3G_disconnected",

    states : {
        "3G_connected" : {
            _onEnter: function() {
                this.handle("tell.connected");
            },

            "tell.connected" : function( payload ) {
                console.log("connected, pid: " + this.wvdialPid)
            }
        },

        "3G_disconnected" : {
            "tell.disconnected" : function( payload ) {
                console.log("disconnected")
            }
        }
    }
});


function runCommand(command, args) {
  var myProcess = spawn(command, args);
  console.log("nodeprocess :", myProcess.pid, "myProcess: ", process.pid);
  myProcess.stdout.pipe(process.stdout);
  myProcess.stderr.pipe(process.stderr);
  return myProcess.pid
};


module.exports = fsm