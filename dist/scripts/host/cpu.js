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
            this.execute(this.fetch());

            this.updateCpu();
        };

        Cpu.prototype.updateCpu = function () {
        };

        Cpu.prototype.fetch = function () {
            return _MemoryManager.getMemory(this.PC);
        };

        Cpu.prototype.execute = function (instruction) {
            console.debug(instruction);
            instruction = String(instruction);
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
            this.Acc = this.getNextTwoBytes();
        };

        // STA - Store the accumulator in memory
        Cpu.prototype.storeAccumulatorInMemory = function () {
            _MemoryManager.storeData(this.Acc.toString(16), this.getNextTwoBytes());
        };

        // ADC - Add with carry. Adds to the accumulator
        Cpu.prototype.addWithCarry = function () {
            this.Acc += parseInt(this.getNextTwoBytes(), 16);
        };

        // LDX - Load x register with a constant
        Cpu.prototype.loadXConstant = function () {
            // Get the data, then translate it
            this.Xreg = parseInt(_MemoryManager.getMemory(++this.PC));
        };

        // LDX - Load x register from memory
        Cpu.prototype.loadXFromMemory = function () {
            this.Xreg = this.getNextTwoBytes();
        };

        // LDY - Load y register with constant
        Cpu.prototype.loadYConstant = function () {
            // Get the data, then translate it
            this.Yreg = parseInt(_MemoryManager.getMemory(++this.PC));
        };

        // LDY - Load y register from memory
        Cpu.prototype.loadYFromMemory = function () {
            this.Yreg = this.getNextTwoBytes();
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

        Cpu.prototype.getNextTwoBytes = function () {
            var firstByte = _MemoryManager.getMemory(++this.PC);
            var secondByte = _MemoryManager.getMemory(++this.PC);
            var hex = secondByte + firstByte;
            var decimal = parseInt(hex, 16);
            return _MemoryManager.getMemory(decimal);
        };
        return Cpu;
    })();
    WesterOS.Cpu = Cpu;
})(WesterOS || (WesterOS = {}));
