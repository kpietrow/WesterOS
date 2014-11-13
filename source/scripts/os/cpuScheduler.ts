/**
 * Helps the CPU manage processes
 */

module WesterOS {
    export class CpuScheduler {
        private quantum = 6;

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
            }
        }


        // Performs RR context switch
        public contextSwitch(): void {
            console.debug("context switch time " + _CurrentProcess.state);
            // Sees if there's another process ready to go
            var nextProcess = this.determineNextProcess();
            if (nextProcess !== null && nextProcess !== undefined) {
                _Kernel.krnTrace("Current cycle count greater than the quantum of " + this.quantum + ". Switching context.");
                console.debug("next process success");
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
                console.debug("next process failure");
                this.stop();
            } else {
                console.debug("else? " + _CurrentProcess.state);
            }

            // Reset cycle counter for a new process
            _CycleCounter = 0;
        }

        // Determines whether or not a context switch is necessary
        public determineNeedToContextSwitch() {
            // Because we're just RR...
            // Only switch if cycle count greater or equal to quantum
            if (_CycleCounter >= this.quantum) {
                return true;
            } else {
                return false;
            }
        }

        // Determines the next process
        // We're just RR right now, so it's the next one in the _ReadyQueue
        private determineNextProcess() {
            return _ReadyQueue.dequeue();
        }

        // Allows user to set the quantum value
        public setQuantum(quantum): void {
            this.quantum = quantum;
        }

        // Stops the scheduler
        private stop(): void {
            console.debug("stop beginning");
            _MemoryManager.removeCurrentProcessFromList();
            console.debug("after remove");
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
        }

    }
}
