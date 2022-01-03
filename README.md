# node-red-contrib-process-resources
A Node-RED node to monitor the OS processes (related to Node-RED).

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
Node-RED runs in its own process on the operating system, which is called the *"main"* process in this node.  When nodes need to do processing that requires a lot of CPU, most of the time new background processes will be ***spawned***.  This means that a new process will be started on the operating system, which will execute the high CPU intensitive task.  That way the other Node-RED tasks can keep running, without being blocked.  That new process will be a ***child process*** of the main process.  And of course those child processes, can again contain nested child processes and so on ...

Of course when the sytem resource (memory, cpu...) of the host server are exhausted, the main thread will also be slowed down.  In that case you need to start a performance analysis, to determine which process is consuming most of the system resources.

This node has been developed in order to assist you a bit with such a performance analysis:
1. It determines which child processes the main process has.
2. It determines the cpu and memory usage of both the main process and all child processes.

### Example flow

