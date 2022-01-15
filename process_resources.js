/**
 * Copyright 2022 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 module.exports = function(RED) {
    var settings = RED.settings;
    var pidUsage = require('pidusage');
    var pidTree  = require('pidtree');

    function ProcessResourcesNode(config) {
        RED.nodes.createNode(this, config);
        this.process         = config.process || "nodered";
        this.pidField        = config.pidField || "";
        this.outputField     = config.outputField;
        this.analyzeChildren = config.analyzeChildren;
        this.sortOrder       = config.sortOrder || "asc";
        this.sortBy          = config.sortBy || "pid";
        this.isBusy          = false;
        
        var node = this;
        
        function roundOneDecimal(number) {
            return Math.round(number * 10) / 10
        }
        
        function sendMessage(rootProcessStats, childProcessesStats, msg) {
            var result = {
                children: childProcessesStats,
                cpuChildren: 0,
                memoryChildren: 0,
                processCount: childProcessesStats.length
            };
            
            // By default the pidTree library already returns the processes sorted ascending by pid
            if(node.sortOrder !== "asc" || node.sortBy !== "pid") {
                result.children.sort(function(a, b) {
                    var sortBy = node.sortBy;
                    if(node.sortOrder === "asc") {
                        return parseFloat(a[sortBy]) - parseFloat(b[sortBy]); // Ascending
                    }
                    else {
                        return parseFloat(b[sortBy]) - parseFloat(a[sortBy]); // Descending
                    }
                });
            }
            
            // Calculate the total cpu and memory of all child processes together
            childProcessesStats.forEach(function(childProcessStats) {
                // Round the cpu to 1 decimal
                childProcessStats.cpu = roundOneDecimal(childProcessStats.cpu);                
                
                result.cpuChildren += childProcessStats.cpu;
                result.memoryChildren += childProcessStats.memory;
            });    

            result.cpuTotal = result.cpuChildren;
            result.memoryTotal = result.memoryChildren;
                
            // When there is a root process, then add its statistics in the ouput message.
            if (rootProcessStats) {
                // Round the cpu to 1 decimal
                rootProcessStats.cpu = roundOneDecimal(rootProcessStats.cpu);
                
                // Calculate the total cpu and memory of all child processes and the main process together
                result.cpuTotal += rootProcessStats.cpu;
                result.memoryTotal += rootProcessStats.memory;

                // Count the (1) root process together with the child processes.
                // Because processCount contains all the processes (i.e. the main process and all the child processes)
                result.processCount++;
               
                result.main = rootProcessStats;
            }
            
            result.cpuTotal = roundOneDecimal(result.cpuTotal);
            result.cpuChildren = roundOneDecimal(result.cpuChildren);
            
            try {
                // Pass the result in the specified output location
                RED.util.setMessageProperty(msg, node.outputField, result);
            }
            catch(err) {
                throw "Error setting result in output msg." + node.outputField + " : " + err.message;
            }
            
            node.send(msg);
        }
        
        function analyzeChildProcesses(rootProcessStats, childProcessIds, msg) {
            if(childProcessIds.length > 0) {
                // Get the statistics of the entire array of child process id's.
                // We won't get statistics for every child process, because some child processes might have been stopped meanwhile
                // (e.g. the WMIC.exe process for the ps-tree library on Windows)
                pidUsage(childProcessIds, function (err, childProcessesStats) {
                    if(err) {
                        // Seems none of the specified child process id's correspondings to an active process.
                        // Which means that there is no active child process, so let's only send the main process
                        sendMessage(rootProcessStats, [], msg);
                    }
                    else {
                        // The childProcessStats is an object, which needs to be converted to an array
                        sendMessage(rootProcessStats, Object.values(childProcessesStats), msg);
                    }
                });
            }
            else {
                sendMessage(rootProcessStats, [], msg);
            }
        }

        node.on("input", function(msg) {
            if(node.isBusy) {
                node.error("The node is already busy calculating");
                return;
            }
            
            node.isBusy = true;
                        
            try {
                switch(node.process) {
                    case "nodered":
                        // The current process is the Node-RED main process, so let's get the usage of that process already
                        pidUsage(process.pid, function (err, mainProcessStats) {
                            if(node.analyzeChildren) {
                                // Get all the child processes of the Node-RED main process
                                pidTree(process.pid, function (err, childPids) {
                                    analyzeChildProcesses(mainProcessStats, childPids || [], msg);
                                });
                            }
                            else {
                                // Only analyze the main Node-RED process
                                analyzeChildProcesses(mainProcessStats, [], msg);
                            }
                        })
                        break;
                    case "all":
                        // Get all the system processes (i.e. no main process)
                        pidTree(-1, function (err, childPids) {
                            // PID 0 is a special kind of process:
                            // - On Windows it is the System Idle Process, which never quits since it isn't a real process.
                            //   But it has a high cpu usage percentage, when the real processes consume less cpu.
                            // - On Linux it is the swapper process, which is responsible for paging and isn't a user-mode process.
                            // Therefore PID 0 will be skipped here...
                            if(childPids[0] === 0) {
                                childPids.shift();
                            }
                            
                            analyzeChildProcesses(null, childPids || [], msg);
                        });
                        break;
                    case "pid":
                        if (!node.pidField || node.pidField.trim() === "") {
                            node.error("No PID field has been specified");
                            return;
                        }
                        
                        try {
                            // Get the pid from the specified input location.
                            var rootPid = RED.util.evaluateNodeProperty(node.pidField, "msg", this, msg);
                        } 
                        catch(err) {
                            node.error("Error getting pid from msg." + node.pidField + " : " + err.message);
                            return;
                        }

                        if(isNaN(rootPid)) {
                            node.error("The specified PID field should contain an integer number");
                            return;
                        }
                        
                        pidUsage(rootPid, function (err, rootProcessStats) {
                            if(node.analyzeChildren) {
                                // Get all the child processes of the specified root process
                                pidTree(rootPid, function (err, childPids) {
                                    analyzeChildProcesses(rootProcessStats, childPids || [], msg);
                                });
                            }
                            else {
                                // Only analyze the specified root process
                                analyzeChildProcesses(rootProcessStats, [], msg);
                            }
                        })
                        
                        break;
                }
            }
            catch(err) {
                node.error(err, msg);
                node.isBusy = false;
            }
        });
        
        node.on("input", function() {
            node.isBusy = false;
        });
    }

    RED.nodes.registerType("process-resources", ProcessResourcesNode);
}
