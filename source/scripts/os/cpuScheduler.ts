/**
 * Helps the CPU manage processes
 */

module WesterOS {
    export class CpuScheduler {
        private quantum = 6;
        public schedulingOptions = ['rr', 'fcfs', 'priority'];
        public scheduler = this.schedulingOptions[0];

        constructor() {
        }

        // Starts the scheduler
        public start(): void {
            // Make sure there is a program to start with
            if (_ReadyQueue.length() > 0) {
                // Set mode to user mode
                _Mode = 1;
                _CurrentProcess = this.determineNextProcess();
                // Process is now running
                _CurrentProcess.state = "RUNNING";
                _CPU.setCpu(_CurrentProcess);

                // Handles the scenario of a file system process being the top priority.
                // Swap it into the file system, trading it with the worst priority process
                // currently in memory.
                if (this.scheduler === this.schedulingOptions[2] && _CurrentProcess.pcb.location === -1) {
                    console.debug("first stage");
                    var unfortunateProcess = null;
                    var unfortunateProcessPriority = -1;
                    var unfortunateProcessIndex = -1;

                    // Finds the process with the worst priority in memory
                    for (var i = 0; i < _ReadyQueue.length(); i++) {
                        // Makes sure it's not the current process
                        if (_ReadyQueue.q[i].pcb.pid !== _CurrentProcess.pcb.pid) {
                            console.debug("not the same");

                            // Find the worst
                            if (_ReadyQueue.q[i].pcb.priority > unfortunateProcessPriority) {
                                unfortunateProcess = _ReadyQueue.q[i];
                                unfortunateProcessPriority = _ReadyQueue.q[i].pcb.priority;
                            }
                        }
                    }

                    // If we have a match
                    if (unfortunateProcessPriority !== -1) {
                        console.debug("well, we got here: " + unfortunateProcess.pcb.pid);
                        this.handleRollInRollOut(unfortunateProcess);
                    }
                }
            }
        }


        public contextSwitch(): void {
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
        }

        // Handles the RR context switch
        public handleRoundRobinSwitch(nextProcess) {
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
        }

        // Handles FCFS context switching. Basically RR in this case, but put it
        // in its own method for future consideration
        public handleFCFSSwitch(nextProcess) {
            this.handleRoundRobinSwitch(nextProcess);
        }

        // Handles Priority switching
        public handlePrioritySwitch(nextProcess) {
            // Update the PCB
            _CPU.updatePcb();
            _MemoryManager.removeCurrentProcessFromList();
        }


        // Determines whether or not a context switch is necessary
        public determineNeedToContextSwitch() {
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
        }

        // Handles process from memory to the file system, and vice versa
        public handleRollInRollOut(lastProcess) {
            // In the file system
            if (_CurrentProcess.pcb.location === -1) {
                if (lastProcess.state !== "TERMINATED") {
                    var rollOutSuccess = _MemoryManager.rollOut(lastProcess);
                    if (!rollOutSuccess) {
                        _Kernel.krnTrace("ERROR: While rolling out PID: " + lastProcess.pcb.pid);
                    }
                }

                var successfulRollIn = _MemoryManager.rollIn(_CurrentProcess);
                if (!successfulRollIn) {
                    _Kernel.krnTrace("ERROR: While rolling in PID: " + lastProcess.pcb.pid);
                }
            }
        }

        // Determines the next process
        private determineNextProcess() {
            // If RR or FCFS, just go to next one in the queue
            if (this.scheduler === this.schedulingOptions[0] || this.scheduler === this.schedulingOptions[1]) {
                return _ReadyQueue.dequeue();
            } else if (this.scheduler === this.schedulingOptions[2]) {

                console.debug("in determine: " + _ReadyQueue.toString());


                // Find process with lowest priority
                var lowestPriority = 999;
                var lowestPriorityIndex = -1;

                // Do it!
                for (var i = 0; i < _ReadyQueue.length(); i++) {
                    if (_ReadyQueue.q[i].pcb.priority < lowestPriority) {
                        lowestPriority = _ReadyQueue.q[i].pcb.priority;
                        lowestPriorityIndex = i;
                    }
                }

                // Found it! Remove from ready queue
                var nextProcess = _ReadyQueue.q[lowestPriorityIndex];
                _ReadyQueue.q.splice(lowestPriorityIndex, 1);
                return nextProcess;

            }
            return null;
        }

        // Allows user to set the quantum value
        public setQuantum(quantum): void {
            this.quantum = quantum;
        }

        // Stops the scheduler
        private stop(): void {
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
        }

    }
}
