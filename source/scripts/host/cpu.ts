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
            this.execute(this.fetch());

            this.updateCpu();
        }

        public updateCpu(): void {

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
            this.Acc = this.getNextTwoBytes();
        }

        // STA - Store the accumulator in memory
        private storeAccumulatorInMemory(): void {
            _MemoryManager.storeData(this.Acc.toString(16), this.getNextTwoBytes());
        }

        // ADC - Add with carry. Adds to the accumulator
        private addWithCarry(): void {
            this.Acc += parseInt(this.getNextTwoBytes(), 16);
        }

        // LDX - Load x register with a constant
        private loadXConstant(): void {
            // Get the data, then translate it
            this.Xreg = parseInt(_MemoryManager.getMemory(++this.PC), 16);
        }

        // LDX - Load x register from memory
        private loadXFromMemory(): void {
            this.Xreg = this.getNextTwoBytes();
        }

        // LDY - Load y register with constant
        private loadYConstant(): void {
            // Get the data, then translate it
            this.Yreg = parseInt(_MemoryManager.getMemory(++this.PC), 16);
        }

        // LDY - Load y register from memory
        private loadYFromMemory(): void {
            this.Yreg = this.getNextTwoBytes();
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
            var byte = this.getNextTwoBytes();

            if (parseInt(this.Xreg) === parseInt(byte)) {
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
            var byte = this.getNextTwoBytes();
            var data = _MemoryManager.getMemory(byte);

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




        private getNextTwoBytes() {
            var firstByte = _MemoryManager.getMemory(++this.PC);
            var secondByte = _MemoryManager.getMemory(++this.PC);
            var hex = secondByte + firstByte;
            var decimal = parseInt(hex, 16);
            return _MemoryManager.getMemory(decimal);
        }
    }
}
