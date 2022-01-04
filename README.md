# node-red-contrib-process-resources
A Node-RED node to monitor the resources used by the OS processes.

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install node-red-contrib-process-resources
```

## Support my Node-RED developments
Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Node usage

### Purpose of this node
Node-RED runs in its own process on the operating system, which is called the *"main"* process in this readme page.  When nodes need to do processing that requires a lot of CPU, most of the time a new background processes will be ***spawned***.  This means that a new process will be started on the operating system, which will be used to execute the high CPU intensitive task.  This way it can be avoided that Node-RED becomes *unresponsive*: indeed the new process will have its own event loop, so the the other Node-RED tasks can keep running without being blocked by the CPU intensive task.  The new spawned process will be a ***child process*** of the main process.  And of course those child processes, can again contain nested child processes and so on...  That way a complete process tree is being created.

Of course when the system resources (memory, cpu...) of the host server are exhausted, the main thread will also be slowed down.  Which means that Node-RED will become unresponsive anyway.  In that case you need to start a performance analysis, to determine which process is consuming most of the system resources.

This node has been developed in order to assist you a bit with such a performance analysis:
1. It determines which child processes the main process has.
2. It determines the cpu and memory usage of both the main process and all its child processes.

### Output message
Simply inject a (random) input message, and as a result an output message will be send.  The output message looks like this, in case of one single child process:

![output msg](https://user-images.githubusercontent.com/14224149/148134001-07cfd9e5-b0cb-4c59-9bb3-049cc2f1ef41.png)

+ The *'main'* section contains information about the main process, i.e. the process where NodeJs and Node-RED are running.
+ The *'children'* section contains the same information for every child process.
+ The *'cpuChildren'* contains the total CPU usage for all child processes together.
+ The *'memoryChildren'* contains the total memory usage for all child processes together.
+ The *'cpuTotal'* contains the total CPU usage for all processes together (i.e. both the main process and all of its child processes).
+ The *'memoryTotal'* contains the total memory usage for all processes together (i.e. both the main process and all of its child processes).
+ The *'processCount'* contains the total number of processes (i.e. both the main process and all of its child processes).

### Visualization in line charts
Line charts are a nice way to show the history of these metrics, since you can easily spot trends.

The following flow fills 3 separate line charts (cpu, memory and process count):

![line charts flow](https://user-images.githubusercontent.com/14224149/148136357-0d8173a7-12b1-41d4-b965-11f866de495d.png)
```
[{"id":"a702721faa2028b8","type":"ui_chart","z":"f3e346780eaa6c3c","name":"CPU - Line chart","group":"89749fb7.87f01","order":3,"width":"7","height":"6","label":"CPU per process - Line chart","chartType":"line","legend":"true","xformat":"HH:mm:ss","interpolate":"linear","nodata":"","dot":false,"ymin":"","ymax":"","removeOlder":1,"removeOlderPoints":"100","removeOlderUnit":"3600","cutout":"30","useOneColor":false,"useUTC":false,"colors":["#1f77b4","#aec7e8","#ff7f0e","#2ca02c","#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5"],"outputs":1,"useDifferentColor":false,"className":"","x":990,"y":1480,"wires":[[]]},{"id":"9577a5ac30fd8b52","type":"change","z":"f3e346780eaa6c3c","name":"CPU main","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.main.cpu","tot":"msg"},{"t":"set","p":"topic","pt":"msg","to":"CPU main","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":770,"y":1440,"wires":[["a702721faa2028b8"]]},{"id":"018b09afd0179b19","type":"change","z":"f3e346780eaa6c3c","name":"CPU children","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.cpuChildren","tot":"msg"},{"t":"set","p":"topic","pt":"msg","to":"CPU children","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":770,"y":1480,"wires":[["a702721faa2028b8"]]},{"id":"1bb0c73d560c1869","type":"change","z":"f3e346780eaa6c3c","name":"CPU total","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.cpuTotal","tot":"msg"},{"t":"set","p":"topic","pt":"msg","to":"CPU total","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":760,"y":1520,"wires":[["a702721faa2028b8"]]},{"id":"4f5061a650314b1f","type":"ui_chart","z":"f3e346780eaa6c3c","name":"Memory -Line chart","group":"89749fb7.87f01","order":3,"width":"7","height":"6","label":"Memory per process - Line chart","chartType":"line","legend":"true","xformat":"HH:mm:ss","interpolate":"linear","nodata":"","dot":false,"ymin":"","ymax":"","removeOlder":1,"removeOlderPoints":"100","removeOlderUnit":"3600","cutout":"30","useOneColor":false,"useUTC":false,"colors":["#1f77b4","#aec7e8","#ff7f0e","#2ca02c","#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5"],"outputs":1,"useDifferentColor":false,"className":"","x":1030,"y":1620,"wires":[[]]},{"id":"c3b853bb9bf28fd5","type":"change","z":"f3e346780eaa6c3c","name":"Memory main","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.main.memory","tot":"msg"},{"t":"set","p":"topic","pt":"msg","to":"Memory main","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":780,"y":1580,"wires":[["4f5061a650314b1f"]]},{"id":"de034c08d0033e67","type":"change","z":"f3e346780eaa6c3c","name":"Memory children","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.memoryChildren","tot":"msg"},{"t":"set","p":"topic","pt":"msg","to":"Memory children","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":790,"y":1620,"wires":[["4f5061a650314b1f"]]},{"id":"722108c9ecbc098d","type":"change","z":"f3e346780eaa6c3c","name":"Memory total","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.memoryTotal","tot":"msg"},{"t":"set","p":"topic","pt":"msg","to":"Memory total","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":770,"y":1660,"wires":[["4f5061a650314b1f"]]},{"id":"e0d4453875716364","type":"change","z":"f3e346780eaa6c3c","name":"Process count","rules":[{"t":"set","p":"payload","pt":"msg","to":"payload.processCount","tot":"msg"},{"t":"set","p":"topic","pt":"msg","to":"Process count","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":780,"y":1720,"wires":[["b8973b659167fbfc"]]},{"id":"b8973b659167fbfc","type":"ui_chart","z":"f3e346780eaa6c3c","name":"Process count - Line chart","group":"89749fb7.87f01","order":3,"width":"7","height":"6","label":"Process count - Line chart","chartType":"line","legend":"true","xformat":"HH:mm:ss","interpolate":"linear","nodata":"","dot":false,"ymin":"","ymax":"","removeOlder":1,"removeOlderPoints":"100","removeOlderUnit":"3600","cutout":"30","useOneColor":false,"useUTC":false,"colors":["#1f77b4","#aec7e8","#ff7f0e","#2ca02c","#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5"],"outputs":1,"useDifferentColor":false,"className":"","x":1010,"y":1720,"wires":[[]]},{"id":"76e129a7dd6c96d3","type":"inject","z":"f3e346780eaa6c3c","name":"Every 3 seconds","props":[{"p":"payload"}],"repeat":"3","crontab":"","once":false,"onceDelay":0.1,"topic":"","payloadType":"date","x":350,"y":1440,"wires":[["27bf45a1dcec67d5"]]},{"id":"27bf45a1dcec67d5","type":"process-resources","z":"f3e346780eaa6c3c","name":"","outputField":"payload","analyzeChildren":true,"x":560,"y":1440,"wires":[["9577a5ac30fd8b52","018b09afd0179b19","1bb0c73d560c1869","c3b853bb9bf28fd5","e0d4453875716364","722108c9ecbc098d","de034c08d0033e67"]]},{"id":"89749fb7.87f01","type":"ui_group","name":"Message Profiler","tab":"d7901f40.2659d","order":2,"disp":true,"width":"16","collapse":false,"className":""},{"id":"d7901f40.2659d","type":"ui_tab","name":"Charts","icon":"dashboard","order":40,"disabled":false,"hidden":false}]
```

Which will result in something like this:

![line charts](https://user-images.githubusercontent.com/14224149/148137991-55357bc1-3f9b-415f-9fc9-a637ec6195db.png)

Note that there I have used 1 line for all the child processes (which represents the sum of the CPU/memory usage of all processes), instead of a line per child process.  The reason is that child processes can be created and aborted continuously, which would result in lines being stopped and started.  That would look very messy.  On the other hand it might be usefull to show them as separate lines, to determine easily which process (pid) is consuming the most CPU...

### Visualization in pie charts
Pie charts are convenient to show the distribution of the metrics across the individual processes.

TODO

Note that every child process get its own piece of the pie, instead of one piece of the pie for all child processes (containing the sum of the CPU/memory usage of all processes).  Because - in contradiction to the line charts - the pie doesn't show any historical data, so it is less messy if child processes are created or aborted.  But of course it might be usefull to show them all summed into a single piece of the pie...


TODO: move to wiki ...

Let's explain this with an example flow:

![image](https://user-images.githubusercontent.com/14224149/148019376-06c9dfac-7559-446d-a64c-f8ff683ab578.png)

1. Start/stop high intensitive CPU work in the Node-RED main thread, to simulate a performance issue.

   Note: you can play with the CPU usage, by adjusting the parameters in the function node.  Currently a timer will use the CPU during 500 msec every 1000 msec, which means about 50% extra load.  When you increase the percentage, be aware that Node-RED will become ***inresponsive***, because you are in the main process (whose event loop needs to do also all the other Node-RED related work)!!

2. Start/stop extra web workers, which again execute high intensitive CPU work.  You will see that the CPU of the main process will be change, because web workers are ***threads with the main process with the same process id (pid)***.  Which is a lightweight solution compared to creating child processes. 

   There is a *limitation* of this node: I didn't find yet how to determine the CPU usage per thread in the Google V8 Javascript engine... 

3. Start/stop extra processes, which again execute high intensitive CPU work.  By ***spawning*** extra processes, they will become child processes of the main thread.  Which means they will show up as separate processes with their own process id (pid).



### Limitation


### Monitoring CPU

### Monitoring Memory

### Monitoring the process count
