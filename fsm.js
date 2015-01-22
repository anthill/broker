"use strict";

var machina = require('machina');
var spawn = require('child_process').spawn;
var kill = require('tree-kill');
var Promise = require('es6-promise').Promise;

var CONNECTION_TIMOUT = 20 * 1000;
var SSH_OK = 3 * 1000;


var fsm = new machina.Fsm({

    wvdialPid: null,
    sshPid: null,

    connect3G: function() {

        var self = this;

        if (this.state !== "3G_connected") {

            new Promise(function(resolve, reject){
                var myProcess = spawn("wvdial", ["3G"]);
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


            })
            .then(function(pid){
                self.wvdialPid = pid;
                self.transition( "3G_connected" );
                return "SUCCESS";
            })
            .catch(function(err){
                console.log(err.msg);
                console.log("Could not connect. Cleanning...");
                self.cleanConnexion(err.pid)
                return "FAILURE";
            });

        } else {
            console.log("Already connected.")
            return "SUCCESS";
        }
        
    },

    cleanConnexion: function(pid){
        // TODO this fucntion should lookup throught ps for wvdial and ppp
        pid = pid || this.wvdialPid;
        console.log("Cleaning pid ", pid);
        var out;
        if (pid > 0){
            kill(pid, 'SIGKILL');
            out = "SUCCESS";
        } else {
            console.log("could not kill signal whose pid is not an integer");
            out = "FAILURE";
        };
        this.transition( "3G_disconnected" );
        return ou;
    },

    disconnect3G: function() {
        console.log("killing process", this.wvdialPid);
        var out;
        if (this.wvdialPid > 0){
            kill(this.wvdialPid, 'SIGKILL');
            out = "SUCCESS";
        } else {
            console.log("could not kill signal null");
            out = "FAILURE";
        };
        this.transition( "3G_disconnected" );
        return out;
    },


    makeTunnel: function(port) {

        if (this.state === "3G_disconnected") {

        }

        new Promise(function(resolve, reject){
            var myProcess = spawn("ssh", ["-N", "-R", port + ":localhost:22", "ants"]);
            console.log("nodeprocess :", myProcess.pid, "myProcess: ", process.pid);

            myProcess.stderr.on("data", function(chunkBuffer){
                var message = chunkBuffer.toString();
                console.log("=> " + message);
                if (message.indexOf("Warning: remote port forwarding failed for listen port") !== -1){
                    reject({pid: myProcess.pid, msg:"[Brocker] Port already in use."});
                } else {
                    setTimeout(function(){resolve(myProcess.pid), SSH_OK);
                }
                
            });


        })
        .then(function(pid){
            self.sshPid = pid;
            self.transition( "3G_tunnel" );
            return "SUCCESS";
        })
        .catch(function(err){
            console.log(err.msg);
            console.log("Could not make the tunnel. Cleanning...");
            // self.cleanConnexion(err.pid)
            return "FAILURE";
        });

    },

    cleanTunnel: function() {
        console.log("killing process", this.sshPid);
        var out;
        if (this.sshPid > 0){
            kill(this.sshPid, 'SIGKILL');
            out = "SUCCESS";
        } else {
            console.log("could not kill signal null");
            out = "FAILURE";
        };
        this.transition( "3G_connected" );
        return out;
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
        },

        "3G_tunnel" : {
            "tell.tunnel" : function( payload ) {
                console.log("tunnel")
            }
        }
    }
});



module.exports = fsm