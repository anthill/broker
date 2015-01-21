"use strict";

var machina = require('machina');
var spawn = require('child_process').spawn;
var kill = require('tree-kill');
var Promise = require('es6-promise').Promise;

var CONNECTION_TIMOUT = 20 * 1000;


var fsm = new machina.Fsm({

    wvdialPid: null,

    connect3G: function() {

        var self = this;

        if (this.state !== "3G_connected") {

            var pp = new Promise(function(resolve, reject){
                var myProcess = spawn("wvdial", ["3G"], {detached: true});
                console.log("nodeprocess :", myProcess.pid, "myProcess: ", process.pid);

                myProcess.stderr.on("data", function(chunkBuffer){
                    var message = chunkBuffer.toString();
                    console.log("=> " + message);
                    if (message.indexOf("Device or resource busy") !== -1){
                        setTimeout(function(){reject({pid: myProcess.pid, msg:"[Brocker] Ressource busy."})}, CONNECTION_TIMOUT);
                    } else if (message.indexOf("The PPP daemon has died") !== -1){
                        setTimeout(function(){reject({pid: myProcess.pid, msg:"[Brocker] PPP died."})}, CONNECTION_TIMOUT);
                    } else if (message.indexOf("local  IP address") !== -1){
                        resolve(myProcess.pid);
                    } else {
                        setTimeout(function(){reject({pid: myProcess.pid, msg:"[Brocker] Request time out."})}, CONNECTION_TIMOUT);
                    }
                    
                });


            });

            pp.then(function(pid){
                self.wvdialPid = pid;
                self.transition( "3G_connected" );
            })
            .catch(function(err){
                console.log(err.msg, pp);
                console.log("Could not connect. Cleanning...");
                if (err.pid > 0){
                    kill(err.pid, 'SIGKILL');
                } else {
                    console.log("could not kill signal whose pid is not an integer")
                }
            });

        } else {
            console.log("Already connected.")
        }
        
    },

    cleanConnexion: function(){

    },

    disconnect3G: function() {
        console.log("killing process", this.wvdialPid);
        if (this.wvdialPid > 0){
            kill(this.wvdialPid, 'SIGKILL');
        } else {
            console.log("could not kill signal null")
        }
        this.transition( "3G_disconnected" );
    },


    initialState: "3G_disconnected",

    states : {
        "3G_connected" : {
            _onEnter: function() {
                this.handle("tell.connected");
            },

            "tell.connected" : function( payload ) {
                console.log("CONNECTED, pid: " + this.wvdialPid)
            }
        },

        "3G_disconnected" : {
            "tell.disconnected" : function( payload ) {
                console.log("disconnected")
            }
        }
    }
});



module.exports = fsm