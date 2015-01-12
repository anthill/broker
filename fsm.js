"use strict";

var machina = require('machina');
var exec = require('child_process').exec;
var psTree = require('ps-tree');



var fsm = new machina.Fsm({

    vwdialPid: null,

    connect3G: function() {
        this.vwdialPid = runCommand("wvdial 3G");
        if (this.vwdialPid !== null){
            this.transition( "3G_connected" );
        };
    },

    disconnect3G: function() {
        killProcess(this.vwdialPid);
        this.transition( "3G_disconnected" );
    },


    initialState: "3G_disconnected",

    states : {
        "3G_connected" : {
            _onEnter: function() {
                this.handle("tell.connected");
            },

            "tell.connected" : function( payload ) {
                console.log("connected, pid: " + this.vwdialPid)
            }
        },

        "3G_disconnected" : {
            "tell.disconnected" : function( payload ) {
                console.log("disconnected")
            }
        }
    }
});


function runCommand(command) {
  var myProcess = exec(command);
  myProcess.stdout.pipe(process.stdout);
  myProcess.stderr.pipe(process.stderr);
  if (myProcess.error !== null){
    return null;
  } else {
    return myProcess.pid
  }

};


function killProcess(pid, signal, callback) {
    signal   = signal || 'SIGKILL';
    callback = callback || function () {};
    var killTree = true;
    if(killTree) {
        psTree(pid, function (err, children) {
            [pid].concat(
                children.map(function (p) {
                    return p.PID;
                })
            ).forEach(function (tpid) {
                try { process.kill(tpid, signal) }
                catch (ex) { }
            });
            callback();
        });
    } else {
        try { process.kill(pid, signal) }
        catch (ex) { }
        callback();
    }
};

module.exports = fsm