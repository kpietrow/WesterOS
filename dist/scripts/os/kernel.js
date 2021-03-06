/* ------------
Kernel.ts
Requires globals.ts
Routines for the Operating System, NOT the host.
This code references page numbers in the text book:
Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
------------ */
var WesterOS;
(function (WesterOS) {
    var Kernel = (function () {
        function Kernel() {
        }
        //
        // OS Startup and Shutdown Routines
        //
        Kernel.prototype.krnBootstrap = function () {
            WesterOS.Control.hostLog("bootstrap", "host"); // Use hostLog because we ALWAYS want this, even if _Trace is off.

            // Initialize our global queues.
            _KernelInterruptQueue = new WesterOS.Queue(); // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array(); // Buffers... for the kernel.
            _KernelInputQueue = new WesterOS.Queue(); // Where device input lands before being processed out somewhere.
            _Console = new WesterOS.Console(); // The command line interface / console I/O device.

            // Initialize the console.
            _Console.init();
            _CPU.init();

            // Initialize standard input and output to the _Console.
            _StdIn = _Console;
            _StdOut = _Console;

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new WesterOS.DeviceDriverKeyboard(); // Construct it.
            _krnKeyboardDriver.driverEntry(); // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            // Load the File System Device Driver
            this.krnTrace("Loading the file system device driver.");
            _FileSystem = new WesterOS.FileSystemDeviceDriver();
            _FileSystem.driverEntry();
            this.krnTrace(_FileSystem.status);

            // CPU stuff
            _CpuScheduler = new WesterOS.CpuScheduler();
            _ProcessList = new Array();
            _ReadyQueue = new WesterOS.Queue();

            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new WesterOS.Shell();
            _OsShell.init();

            // Finally, initiate testing.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        };

        Kernel.prototype.krnShutdown = function () {
            this.krnTrace("begin shutdown OS");

            // TODO: Check for running processes.  Alert if there are some, alert and stop.  Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();

            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
        };

        Kernel.prototype.krnOnCPUClockPulse = function () {
            /* This gets called from the host hardware sim every time there is a hardware clock pulse.
            This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
            This, on the other hand, is the clock pulse from the hardware (or host) that tells the kernel
            that it has to look for interrupts and process them if it finds any.                           */
            // Check for an interrupt, are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (_CPU.isExecuting) {
                // Now that we're handling multiple programs, we need to know if a context switch is necessary
                if (_CpuScheduler.determineNeedToContextSwitch()) {
                    _CpuScheduler.contextSwitch();
                }
                _CPU.cycle();

                WesterOS.Control.displayCpu();
                WesterOS.Control.displayReadyQueue();
                WesterOS.Control.displayHardDrive();
                _MemoryManager.displayMemory();
                //_CPU.printCPU();
            } else {
                this.krnTrace("Idle");
            }
        };

        //
        // Interrupt Handling
        //
        Kernel.prototype.krnEnableInterrupts = function () {
            // Keyboard
            WesterOS.Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        };

        Kernel.prototype.krnDisableInterrupts = function () {
            // Keyboard
            WesterOS.Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        };

        Kernel.prototype.krnInterruptHandler = function (irq, params) {
            // This is the Interrupt Handler Routine.  Pages 8 and 560. {
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on.  Page 766.
            this.krnTrace("Handling IRQ~" + irq);

            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR(); // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params); // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                case PROCESS_EXECUTION_IRQ:
                    console.debug("Process exec irq");
                    if (_CPU.isExecuting) {
                        if (_CpuScheduler.determineNeedToContextSwitch()) {
                            _CpuScheduler.contextSwitch();
                        }
                    } else {
                        _CpuScheduler.start();
                    }
                    break;
                case CONTEXT_SWITCH_IRQ:
                    console.debug("context switch irq");
                    _CpuScheduler.contextSwitch();
                    break;
                case MEMORY_ACCESS_VIOLATION_IRQ:
                    console.debug("mem access violation irq");

                    // Shut it down Liz Lemon!
                    _CurrentProcess.state = "TERMINATED";

                    // Remove it from the list. SHAME.
                    _MemoryManager.removeCurrentProcessFromList();
                    this.krnTrace("PID " + _CurrentProcess.pcb.pid + " killed");
                    this.krnTrace("Memory access violation. PID " + _CurrentProcess.pcb.pid + " attempted to access memory location " + params[0]);

                    // Context switch it
                    _CpuScheduler.contextSwitch();
                    break;

                case CPU_BREAK_IRQ:
                    console.debug("cpu break irq");

                    // Terminate the program
                    _CurrentProcess.pcb.state = "TERMINATED";

                    // Context switch it
                    _CpuScheduler.contextSwitch();
                    break;

                case SYS_OPCODE_IRQ:
                    console.debug("sys opcode irq");
                    _StdIn.handleSysOpCode();
                    break;

                case UNKNOWN_OPCODE_IRQ:
                    var date = new Date();
                    console.debug("unknown opcode irq");
                    this.krnTrace("Unknown opcode: " + _MemoryManager.getMemory(_CPU.PC - 1));
                    _CurrentProcess.state = "TERMINATED";

                    // Context switch it
                    _CpuScheduler.contextSwitch();
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        };

        Kernel.prototype.krnTimerISR = function () {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
        };

        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile
        //
        // OS Utility Routines
        //
        Kernel.prototype.krnTrace = function (msg) {
            // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
            if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would lag the browser very quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        WesterOS.Control.hostLog(msg, "OS");
                    }
                } else {
                    WesterOS.Control.hostLog(msg, "OS");
                }
            }
        };

        // Goes into a 'bsod'
        Kernel.prototype.krnTrapError = function (msg) {
            WesterOS.Control.hostLog("OS ERROR - TRAP: " + msg);

            // TODO: Display error on console, perhaps in some sort of colored screen. (Perhaps blue?)
            _Console.bsod();
            this.krnShutdown();
        };
        return Kernel;
    })();
    WesterOS.Kernel = Kernel;
})(WesterOS || (WesterOS = {}));
