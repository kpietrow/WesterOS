/**
* Helps the CPU manage processes
*/
var WesterOS;
(function (WesterOS) {
    var CpuScheduler = (function () {
        function CpuScheduler() {
            this.quantum = 6;
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

                // Updates the display
                WesterOS.Control.displayCpu();
                WesterOS.Control.displayPcb();
                _MemoryManager.displayMemory();

                var lastProcess = _CurrentProcess;
                _CurrentProcess = nextProcess;
                _CurrentProcess.state = "RUNNING";
                _CPU.setCpu(_CurrentProcess);
            } else if (_CurrentProcess.state === "TERMINATED") {
                this.stop();
            }

            // Reset cycle counter for a new process
            _CycleCounter = 0;
        };

        // Determines whether or not a context switch is necessary
        CpuScheduler.prototype.determineNeedToContextSwitch = function () {
            // Because we're just RR...
            // Only switch if cycle count greater or equal to quantum
            if (_CycleCounter >= this.quantum) {
                return true;
            } else {
                return false;
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
            WesterOS.Control.displayPcb();

            // Reset current process
            _CurrentProcess = null;

            // Reset cycle counter
            _CycleCounter = 0;
            console.debug("at end");
        };
        return CpuScheduler;
    })();
    WesterOS.CpuScheduler = CpuScheduler;
})(WesterOS || (WesterOS = {}));
