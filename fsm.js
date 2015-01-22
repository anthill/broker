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

        return new Promise(function(resolve1, reject1){

            if (self.state !== "3G_connected") {

                new Promise(function(resolve, reject){
                    var myProcess = spawn("wvdial", ["3G"]);
                    console.log("nodeprocess :", myProcess.pid, "myProcess: ", process.pid);

                    myProcess.stderr.on("data", function(chunkBuffer){
                        var message = chunkBuffer.toString();
                        console.log("=> " + message);
                        if (message.indexOf("Device or resource busy") !== -1){
                            setTimeout(function(){reject({pid: myProcess.pid, msg:"Ressource busy."})}, CONNECTION_TIMOUT);
                        } else if (message.indexOf("The PPP daemon has died") !== -1){
                            setTimeout(function(){reject({pid: myProcess.pid, msg:"PPP died."})}, CONNECTION_TIMOUT);
                        } else if (message.indexOf("local  IP address") !== -1){
                            resolve(myProcess.pid);
                        } else {
                            setTimeout(function(){reject({pid: myProcess.pid, msg:"Request time out."})}, CONNECTION_TIMOUT);
                        }
                    });
                })
                .then(function(pid){
                    self.wvdialPid = pid;
                    self.transition( "3G_connected" );
                    resolve1("SUCCESS");
                })
                .catch(function(err){
                    console.log(err.msg);
                    console.log("Could not connect. Cleanning...");
                    self.cleanConnexion(err.pid)
                    reject1("FAILURE " + err.msg);
                });

            } else {
                console.log("Already connected.")
                resolve1("SUCCESS");
            }
        });
        
    },

    cleanConnexion: function(pid){

        var self = this;

        return new Promise(function(resolve1, reject1){
            // TODO this fucntion should lookup throught ps for wvdial and ppp
            pid = pid || self.wvdialPid;
            console.log("Cleaning pid ", pid);
            if (pid > 0){
                kill(pid, 'SIGKILL');
                self.transition( "3G_disconnected" );
                resolve1("SUCCESS");
            } else {
                console.log("could not kill signal whose pid is not an integer");
                reject1("FAILURE");
            };
        });
    },

    disconnect3G: function() {

        var self = this;

        return new Promise(function(resolve1, reject1){
            console.log("killing process", self.wvdialPid);
            var out;
            if (self.wvdialPid > 0){
                kill(self.wvdialPid, 'SIGKILL');
                resolve1("SUCCESS");
                self.transition( "3G_disconnected" );
            } else {
                console.log("could not kill signal null");
                reject1("FAILURE");
            };
        });
    },


    makeTunnel: function(port) {

        var self = this;

        return new Promise(function(resolve1, reject1){

            // if (this.state === "3G_disconnected") {

            // }

            new Promise(function(resolve, reject){
                var myProcess = spawn("ssh", ["-N", "-R", port + ":localhost:22", "ants"]);
                console.log("nodeprocess :", myProcess.pid, "myProcess: ", process.pid);

                myProcess.stderr.on("data", function(chunkBuffer){
                    var message = chunkBuffer.toString();
                    console.log("=> " + message);
                    if (message.indexOf("Warning: remote port forwarding failed for listen port") !== -1){
                        reject({pid: myProcess.pid, msg:"Port already in use."});
                    }
                });
                // if no error after SSH_OK then validate the connexion
                setTimeout(function(){resolve(myProcess.pid)}, SSH_OK);


            })
            .then(function(pid){
                self.sshPid = pid;
                self.transition( "3G_tunnel" );
                resolve1("SUCCESS");
            })
            .catch(function(err){
                console.log(err.msg);
                console.log("Could not make the tunnel. Cleanning...");
                // self.cleanConnexion(err.pid)
                reject1("FAILURE " + err.msg);
            });

        })

    },

    cleanTunnel: function() {

        var self = this;

        return new Promise(function(resolve1, reject1){
            console.log("killing process", self.sshPid);
            if (self.sshPid > 0){
                kill(self.sshPid, 'SIGKILL');
                self.transition( "3G_connected" );
                resolve1("SUCCESS");
            } else {
                console.log("could not kill signal null");
                reject1("FAILURE");
            };
        });
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