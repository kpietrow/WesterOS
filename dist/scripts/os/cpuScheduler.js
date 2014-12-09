/**
* Helps the CPU manage processes
*/
var WesterOS;
(function (WesterOS) {
    var CpuScheduler = (function () {
        function CpuScheduler() {
            this.quantum = 6;
            this.schedulingOptions = ['rr', 'fcfs', 'priority'];
            this.scheduler = this.schedulingOptions[0];
        }
        // Starts the scheduler
        CpuScheduler.prototype.start = function () {
            // Make sure there is a program to start with
            if (_ReadyQueue.length() > 0) {
                // Set mode to user mode
                _Mode = 1;
                _CurrentProcess = this.determineNextProcess();

                // Process is now running
                _CurrentProcess.state = "RUNNING";
                _CPU.setCpu(_CurrentProcess);
            }
        };

        // Performs RR context switch
        CpuScheduler.prototype.contextSwitch = function () {
            // Sees if there's another process ready to go
            var nextProcess = this.determineNextProcess();
            if (nextProcess !== null && nextProcess !== undefined) {
                // Context switching is now dependent on the scheduling option
                if (this.scheduler === this.schedulingOptions[0]) {
                    this.handleRoundRobinSwitch(nextProcess);
                } else if (this.scheduler === this.schedulingOptions[1]) {
                    this.handleFCFSSwitch(nextProcess);
                } else if (this.scheduler === this.schedulingOptions[2]) {
                    this.handlePrioritySwitch(nextProcess);
                } else {
                    // Unlikely
                    _Kernel.krnTrace("Unknown scheduler. Wat?");
                }

                // Updates the display
                WesterOS.Control.displayCpu();
                WesterOS.Control.displayReadyQueue();
                _MemoryManager.displayMemory();

                var lastProcess = _CurrentProcess;
                _CurrentProcess = nextProcess;
                _CurrentProcess.state = "RUNNING";

                // Handle roll in and roll out
                this.handleRollInRollOut(lastProcess);

                _CPU.setCpu(_CurrentProcess);
            } else if (_CurrentProcess.state === "TERMINATED") {
                this.stop();
            }

            // Reset cycle counter for a new process
            _CycleCounter = 0;

            console.debug(_CurrentProcess.pcb.base);
        };

        // Handles the RR context switch
        CpuScheduler.prototype.handleRoundRobinSwitch = function (nextProcess) {
            _Kernel.krnTrace("Current cycle count greater than the quantum of " + this.quantum + ". Switching context.");

            // Updates current program with state of CPU
            _CPU.updatePcb();

            // We don't want the current program if it's terminated
            if (_CurrentProcess.state !== "TERMINATED") {
                _CurrentProcess.state = "READY";

                // Put back in the queue
                _ReadyQueue.enqueue(_CurrentProcess);
            } else if (_CurrentProcess.state === "TERMINATED") {
                _MemoryManager.removeCurrentProcessFromList();
            }
        };

        // Handles FCFS context switching. Basically RR in this case, but put it
        // in its own method for future consideration
        CpuScheduler.prototype.handleFCFSSwitch = function (nextProcess) {
            this.handleRoundRobinSwitch(nextProcess);
        };

        // Determines whether or not a context switch is necessary
        CpuScheduler.prototype.determineNeedToContextSwitch = function () {
            // RR
            if (this.scheduler === this.schedulingOptions[0]) {
                // Only switch if cycle count greater or equal to quantum
                if (_CycleCounter >= this.quantum) {
                    return true;
                }
                // FCFS
            } else if (this.scheduler === this.schedulingOptions[1]) {
                // Switch if current process is terminated
                if (_CurrentProcess.state === "TERMINATED") {
                    return true;
                }
                // Priority
            } else if (this.scheduler === this.schedulingOptions[2]) {
                // Switch if current process is terminated
                if (_CurrentProcess.state === "TERMINATED") {
                    return true;
                }
            }

            // If not, don't switch
            return false;
        };

        // Handles process from memory to the file system, and vice versa
        CpuScheduler.prototype.handleRollInRollOut = function (lastProcess) {
            // In the file system
            if (_CurrentProcess.pcb.location === -1) {
                if (lastProcess.state !== "TERMINATED") {
                    var rollOutSuccess = _MemoryManager.rollOut(lastProcess);
                    if (!rollOutSuccess) {
                        console.debug("failure roll out");
                        _Kernel.krnTrace("ERROR: While rolling out PID: " + lastProcess.pcb.pid);
                    }
                }

                var successfulRollIn = _MemoryManager.rollIn(_CurrentProcess);
                if (!successfulRollIn) {
                    console.debug("failure roll in");
                    _Kernel.krnTrace("ERROR: While rolling in PID: " + lastProcess.pcb.pid);
                }
            }
        };

        // Determines the next process
        // We're just RR right now, so it's the next one in the _ReadyQueue
        CpuScheduler.prototype.determineNextProcess = function () {
            return _ReadyQueue.dequeue();
        };

        // Allows user to set the quantum value
        CpuScheduler.prototype.setQuantum = function (quantum) {
            this.quantum = quantum;
        };

        // Stops the scheduler
        CpuScheduler.prototype.stop = function () {
            _MemoryManager.removeCurrentProcessFromList();
            _CPU.isExecuting = false;

            // Set mode back to kernel mode
            _Mode = 0;

            // Update display
            _CPU.updatePcb();
            WesterOS.Control.displayReadyQueue();

            // Reset current process
            _CurrentProcess = null;

            // Reset cycle counter
            _CycleCounter = 0;
        };
        return CpuScheduler;
    })();
    WesterOS.CpuScheduler = CpuScheduler;
})(WesterOS || (WesterOS = {}));
