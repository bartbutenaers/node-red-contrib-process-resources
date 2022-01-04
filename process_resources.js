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
        this.outputField = config.outputField;
        this.analyzeChildren = config.analyzeChildren;
        this.isBusy = false;
        
        var node = this;
        
        function analyzeChildProcess(childPids, msg, childrenInfo) {
            if(childPids.length === 0) {
                // After all child processes have been analyzed, the parent (Node-RED) process needs to be analyzed
                pidUsage(process.pid, function (err, stats) {
                    var cpuChildren = 0;
                    var memoryChildren = 0;
                    
                    // Calculate the total cpu and memory of all child processes together
                    childrenInfo.forEach(function(childInfo) {
                        cpuChildren += childInfo.cpu;
                        memoryChildren += childInfo.memory;
                    });
                    
                    // Calculate the total cpu and memory of all child processes and the parent process together
                    var cpuTotal = stats.cpu + cpuChildren;
                    var memoryTotal = stats.memory + memoryChildren;
                    
                    // Count the number of processes (i.e. the main process and the number of child processes)
                    var processCount = childrenInfo.length + 1;
                    
                    var output = {
                        parent: {
                            cpu: stats.cpu,
                            memory: stats.memory,
                            pid: stats.pid
                        },
                        children: childrenInfo,
                        cpuChildren: cpuChildren,
                        memoryChildren: memoryChildren,
                        cpuTotal: cpuTotal,
                        memoryTotal: memoryTotal,
                        processCount: processCount
                    }
                    
                    try {
                        // Pass the output result in the specified output location
                        RED.util.setMessageProperty(msg, node.outputField, output);
                    }
                    catch(err) {
                        throw "Error setting output result result in msg." + node.outputField + " : " + err.message;
                    }
                    
                    node.send(msg);
                });
            }
            else {
                // Remove the first child process id from the array
                var childPid = childPids.shift();
                
                // Analyze the first child process id from the array
                pidUsage(childPid, function (err, stats) {
                    // It could be that the child process has meanwhile stopped already (e.g. the WMIC.exe process for the ps-tree library on Windows)
                    if (!err) {
                        childrenInfo.push({
                            cpu:    stats.cpu,
                            memory: stats.memory,
                            pid:    stats.pid
                        });
                    }
        
                    // Analyze the remaining child process id (recursively)
                    analyzeChildProcess(childPids, msg, childrenInfo);
                });
            }
        }

        node.on("input", function(msg) {
            if(node.isBusy) {
                node.error("The node is already busy calcuting");
                return;
            }
            
            node.isBusy = true;
            
            try {
                if(node.analyzeChildren) {
                    pidTree(process.pid, function (err, childPids) {
                        analyzeChildProcess(childPids, msg, []);
                    });
                }
                else {
                    analyzeChildProcess([], msg, []);
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
