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

module WesterOS {

    export class Cpu {

        constructor(public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public IR: string= "",
                    public isExecuting: boolean = false) {

        }

        public init(): void {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }


        public setCpu(process): void {
            this.PC = process.pcb.pc;
            this.Acc = process.pcb.acc;
            this.Xreg = process.pcb.xReg;
            this.Yreg = process.pcb.yReg;
            this.Zflag = process.pcb.zFlag;
            this.isExecuting = true;
        }

        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            _CycleCounter++;
            this.execute(this.fetch());

            this.updateCpu();
        }

        public updateCpu(): void {

            if (this.isExecuting) {
                this.updatePcb();
            }

        }

        // Keeps the PCB up to date
        public updatePcb(): void {
            _CurrentProcess.pcb.pc = _CPU.PC;
            _CurrentProcess.pcb.acc = _CPU.Acc;
            _CurrentProcess.pcb.xReg = _CPU.Xreg;
            _CurrentProcess.pcb.yReg = _CPU.Yreg;
            _CurrentProcess.pcb.zFlag = _CPU.Zflag;

        }

        private fetch() {
            return _MemoryManager.getMemory(this.PC);
        }

        public execute(instruction) {
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
                _KernelInterruptQueue.enqueue(new Interrupt(UNKNOWN_OPCODE_IRQ));
                console.debug(_KernelInterruptQueue.toString());

            }
            // Increment and continue
            this.PC++;

        }

        // LDA - Load the accumulator with a constant value
        private loadAccumulatorConstant(): void {
            this.Acc = parseInt(_MemoryManager.getMemory(++this.PC), 16);
        }

        // LDA - Load the accumulator from memory
        private loadAccumulatorFromMemory(): void {
            this.Acc = this.getDataFromNextTwoBytes();
        }

        // STA - Store the accumulator in memory
        private storeAccumulatorInMemory(): void {
            _MemoryManager.storeData(this.Acc.toString(16), this.getNextTwoBytes());
        }

        // ADC - Add with carry. Adds to the accumulator
        private addWithCarry(): void {
            this.Acc += parseInt(this.getDataFromNextTwoBytes(), 16);
        }

        // LDX - Load x register with a constant
        private loadXConstant(): void {
            // Get the data, then translate it
            this.Xreg = parseInt(_MemoryManager.getMemory(++this.PC), 16);
        }

        // LDX - Load x register from memory
        private loadXFromMemory(): void {
            this.Xreg = this.getDataFromNextTwoBytes();
        }

        // LDY - Load y register with constant
        private loadYConstant(): void {
            // Get the data, then translate it
            this.Yreg = parseInt(_MemoryManager.getMemory(++this.PC), 16);
        }

        // LDY - Load y register from memory
        private loadYFromMemory(): void {
            this.Yreg = this.getDataFromNextTwoBytes();
        }

        // BRK - Break!
        private break(): void {
            // Update PCB
            _CurrentProcess.pcb.pc = this.PC;
            _CurrentProcess.pcb.acc = this.Acc;
            _CurrentProcess.pcb.xReg = this.Xreg;
            _CurrentProcess.pcb.yReg = this.Yreg;
            _CurrentProcess.pcb.zFlag = this.Zflag;
            // Then get the hell out of Dodge!
            _KernelInterruptQueue.enqueue(new Interrupt(CPU_BREAK_IRQ));
        }

        // CPX - Compare a byte in memory to the x flag, set's the Z flag if equal
        private compareToX(): void {
            var byte = this.getDataFromNextTwoBytes();

            if (parseInt(String(this.Xreg)) === parseInt(byte)) {
                this.Zflag = 1;
            } else {
                this.Zflag = 0;
            }
        }

        // BNE - Branch x bytes if z flag === 0
        private branchNotEqual(): void {
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
        }

        // INC - Increment byte's value
        private increment(): void {
            // Get location of data at that location
            var location = this.getNextTwoBytes();
            var data = _MemoryManager.getMemory(location);

            // Convert to increment
            data = parseInt(data, 16);
            // Increment. DO IT, DO IT NOW!
            data++;

            // Store data as hex
            _MemoryManager.storeData(data.toString(16), location);
        }

        // SYS - System Call
        private systemCall(): void {
            _KernelInterruptQueue.enqueue(new Interrupt(SYS_OPCODE_IRQ));
        }

        private printCPU(): void {
            //console.debug(this.PC + ", " + this.Acc + ", " + this.Xreg + ", " + this.Yreg + ", " + this.Zflag + "");
        }




        private getNextTwoBytes() {
            var firstByte = _MemoryManager.getMemory(++this.PC);
            var secondByte = _MemoryManager.getMemory(++this.PC);
            var hex = secondByte + firstByte;
            var decimal = parseInt(hex, 16);
            return decimal;
        }

        private getDataFromNextTwoBytes() {
            return _MemoryManager.getMemory(this.getNextTwoBytes());
        }
    }
}
