///<reference path="../globals.ts" />
/* ------------
CPU.ts
Requires global.ts.
Routines for the host CPU simulation, NOT for the OS itself.
In this manner, it's A LITTLE BIT like a hypervisor,
in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
TypeScript/JavaScript in both the host and client environments.
This code references page numbers in the text book:
Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
------------ */
var WesterOS;
(function (WesterOS) {
    var Cpu = (function () {
        function Cpu(PC, Acc, Xreg, Yreg, Zflag, IR, isExecuting) {
            if (typeof PC === "undefined") { PC = 0; }
            if (typeof Acc === "undefined") { Acc = 0; }
            if (typeof Xreg === "undefined") { Xreg = 0; }
            if (typeof Yreg === "undefined") { Yreg = 0; }
            if (typeof Zflag === "undefined") { Zflag = 0; }
            if (typeof IR === "undefined") { IR = ""; }
            if (typeof isExecuting === "undefined") { isExecuting = false; }
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.IR = IR;
            this.isExecuting = isExecuting;
        }
        Cpu.prototype.init = function () {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        };

        Cpu.prototype.setCpu = function (process) {
            this.PC = process.pcb.pc;
            this.Acc = process.pcb.acc;
            this.Xreg = process.pcb.xReg;
            this.Yreg = process.pcb.yReg;
            this.Zflag = process.pcb.zFlag;
            this.isExecuting = true;
        };

        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');

            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            _CycleCounter++;
            this.execute(this.fetch());

            this.updateCpu();
        };

        Cpu.prototype.updateCpu = function () {
            if (this.isExecuting) {
                this.updatePcb();
                console.debug("pcb: -" + _CurrentProcess.pcb.pid + "- " + this.PC + " " + this.Acc + " " + this.Xreg + " " + this.Yreg + " " + this.Zflag);
            }
        };

        // Keeps the PCB up to date
        Cpu.prototype.updatePcb = function () {
            _CurrentProcess.pcb.pc = this.PC;
            _CurrentProcess.pcb.acc = this.Acc;
            _CurrentProcess.pcb.xReg = this.Xreg;
            _CurrentProcess.pcb.yReg = this.Yreg;
            _CurrentProcess.pcb.zFlag = this.Zflag;
        };

        Cpu.prototype.fetch = function () {
            return _MemoryManager.getMemory(this.PC);
        };

        Cpu.prototype.execute = function (instruction) {
            instruction = String(instruction);

            // console.debug(instruction);
            var x = 0;

            if (instruction === 'A9') {
                this.loadAccumulatorConstant();
            } else if (instruction === 'AD') {
                this.loadAccumulatorFromMemory();
            } else if (instruction === '8D') {
                this.storeAccumulatorInMemory();
            } else if (instruction === '6D') {
                this.addWithCarry();
            } else if (instruction === 'A2') {
                this.loadXConstant();
            } else if (instruction === 'AE') {
                this.loadXFromMemory();
            } else if (instruction === 'A0') {
                this.loadYConstant();
            } else if (instruction === 'AC') {
                this.loadYFromMemory();
            } else if (instruction === 'EA') {
                // No operation! Wooo!
            } else if (instruction === '00') {
                this.break();
            } else if (instruction === 'EC') {
                this.compareToX();
            } else if (instruction === 'D0') {
                this.branchNotEqual();
            } else if (instruction === 'EE') {
                this.increment();
            } else if (instruction === 'FF') {
                this.systemCall();
            } else {
                // Interrupt to handle unknown code
                _KernelInterruptQueue.enqueue(new WesterOS.Interrupt(UNKNOWN_OPCODE_IRQ));
            }

            // Increment and continue
            this.PC++;
        };

        // LDA - Load the accumulator with a constant value
        Cpu.prototype.loadAccumulatorConstant = function () {
            this.Acc = parseInt(_MemoryManager.getMemory(++this.PC), 16);
        };

        // LDA - Load the accumulator from memory
        Cpu.prototype.loadAccumulatorFromMemory = function () {
            this.Acc = parseInt(this.getDataFromNextTwoBytes(), 16);
        };

        // STA - Store the accumulator in memory
        Cpu.prototype.storeAccumulatorInMemory = function () {
            _MemoryManager.storeData(this.Acc.toString(16), this.getNextTwoBytes());
        };

        // ADC - Add with carry. Adds to the accumulator
        Cpu.prototype.addWithCarry = function () {
            this.Acc += parseInt(this.getDataFromNextTwoBytes(), 16);
        };

        // LDX - Load x register with a constant
        Cpu.prototype.loadXConstant = function () {
            // Get the data, then translate it
            this.Xreg = parseInt(_MemoryManager.getMemory(++this.PC), 16);
        };

        // LDX - Load x register from memory
        Cpu.prototype.loadXFromMemory = function () {
            this.Xreg = parseInt(this.getDataFromNextTwoBytes(), 16);
        };

        // LDY - Load y register with constant
        Cpu.prototype.loadYConstant = function () {
            // Get the data, then translate it
            this.Yreg = parseInt(_MemoryManager.getMemory(++this.PC), 16);
        };

        // LDY - Load y register from memory
        Cpu.prototype.loadYFromMemory = function () {
            this.Yreg = parseInt(this.getDataFromNextTwoBytes(), 16);
        };

        // BRK - Break!
        Cpu.prototype.break = function () {
            // Update PCB
            _CurrentProcess.pcb.pc = this.PC;
            _CurrentProcess.pcb.acc = this.Acc;
            _CurrentProcess.pcb.xReg = this.Xreg;
            _CurrentProcess.pcb.yReg = this.Yreg;
            _CurrentProcess.pcb.zFlag = this.Zflag;

            // Then get the hell out of Dodge!
            _KernelInterruptQueue.enqueue(new WesterOS.Interrupt(CPU_BREAK_IRQ));
        };

        // CPX - Compare a byte in memory to the x flag, set's the Z flag if equal
        Cpu.prototype.compareToX = function () {
            var byte = parseInt(this.getDataFromNextTwoBytes(), 16);

            if (parseInt(String(this.Xreg)) === parseInt(byte)) {
                this.Zflag = 1;
            } else {
                this.Zflag = 0;
            }
        };

        // BNE - Branch x bytes if z flag === 0
        Cpu.prototype.branchNotEqual = function () {
            if (this.Zflag === 0) {
                this.PC += parseInt(_MemoryManager.getMemory(++this.PC), 16) + 1;

                // Check memory limit
                if (this.PC >= PROGRAM_SIZE) {
                    // Then we've got to fix it
                    this.PC -= PROGRAM_SIZE;
                }
                // Don't evaluate next byte is zflag is not 0
            } else {
                ++this.PC;
            }
        };

        // INC - Increment byte's value
        Cpu.prototype.increment = function () {
            // Get location of data at that location
            var location = this.getNextTwoBytes();
            var data = _MemoryManager.getMemory(location);

            // Convert to increment
            data = parseInt(data, 16);

            // Increment. DO IT, DO IT NOW!
            data++;

            // Store data as hex
            _MemoryManager.storeData(data.toString(16), location);
        };

        // SYS - System Call
        Cpu.prototype.systemCall = function () {
            _KernelInterruptQueue.enqueue(new WesterOS.Interrupt(SYS_OPCODE_IRQ));
        };

        Cpu.prototype.printCPU = function () {
            //console.debug(this.PC + ", " + this.Acc + ", " + this.Xreg + ", " + this.Yreg + ", " + this.Zflag + "");
        };

        Cpu.prototype.getNextTwoBytes = function () {
            var firstByte = _MemoryManager.getMemory(++this.PC);
            var secondByte = _MemoryManager.getMemory(++this.PC);
            var hex = secondByte + firstByte;
            var decimal = parseInt(hex, 16);
            return decimal;
        };

        Cpu.prototype.getDataFromNextTwoBytes = function () {
            return _MemoryManager.getMemory(this.getNextTwoBytes());
        };
        return Cpu;
    })();
    WesterOS.Cpu = Cpu;
})(WesterOS || (WesterOS = {}));
