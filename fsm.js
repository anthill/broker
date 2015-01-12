"use strict";

var machina = require('machina');
var exec = require('child_process').exec;
var psTree = require('ps-tree');


var fsm = new machina.Fsm({
    connect3G: function() {
        var offline = false;
        // do the command
        this.transition( "3G_connected" );
        return offline;
    },


    initialState: "3G_disconnected",

    states : {
        "3G_connected" : {
            _onEnter: function() {
                this.handle("tell.connected");
            },

            "tell.connected" : function( payload ) {
                console.log("connected")
            }
        },

        "3G_disconnected" : {
            "tell.disconnected" : function( payload ) {
                console.log("disconnected")
            }
        }
    }
});


  // var myProcess = exec(command);
  // myProcess.stdout.pipe(process.stdout);
  // myProcess.stderr.pipe(process.stderr);
  // myProcess.on('exit', theEnd);
  // myProcess.on('uncaughtException', theEnd);

  // console.log('process, myProcess, casper', process.pid, myProcess.pid);





var kill = function (pid, signal, callback) {
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

function theEnd(code){
    console.log('casper process exit with code', code);
    // serverProcess.on('exit', function(){
    //     process.exit(code);
    // });
    // serverProcess.kill();
}


// kill(child.pid);

module.exports = fsm