/**
 * Manages host memory
 */

module WesterOS {
    export class MemoryManager {

        // Create the memory
        public memory = new Memory(MEMORY_SIZE);
        public locations = new Array(NUMBER_OF_PROGRAMS);

        constructor() {
            for (var i = 0; i < this.locations.length; i++) {
                this.locations[i] = {
                    active: false,
                    base: i * PROGRAM_SIZE,
                    limit: (i + 1) * PROGRAM_SIZE
                };
            }

        }

        public init(): void {
            this.displayMemory();
        }

        // Load program from the User Input
        public loadProgram(program) {
            var programLocation = this.getAvailableProgramLocation();

            // Main memory is full, try to put it into the file system
            if (programLocation === null) {

                var pcb = new Pcb();
                var file = _FileSystem.createFile("swap" + pcb.pid);

                if (file.status === "error"){
                    _StdOut.putText("ERROR: No available program locations are left in memory or in the file system");
                    return null;
                }

                var write = _FileSystem.writeFile("swap" + pcb.pid);

                if (write.status === "error") {
                    _StdOut.putText(write.message);
                    return null;
                }

                pcb.location = -1;
                _ProcessList[pcb.pid] = { pcb: pcb, state: "NEW"}

                return pcb.pid;

            } else {
                // Create PCB for process
                var thisPcb = new Pcb();

                // Determines the base location in memory for the program
                thisPcb.base = ((programLocation + 1) * PROGRAM_SIZE) - PROGRAM_SIZE;
                // Determines the upper bound of the new program
                thisPcb.limit = ((programLocation + 1) * PROGRAM_SIZE) - 1;

                thisPcb.location = programLocation;

                // Load the program into memory
                this.loadProgramIntoMemory(program, programLocation);

                // Have a process list with every loaded program
                _ProcessList[thisPcb.pid] = { pcb: thisPcb,
                    state: "NEW"
                };

                return thisPcb.pid;
            }
        }

        // Moves process to the file system
        public rollOut (program) {
            _Kernel.krnTrace("Rolling out PID: " + program.pcb.pid);

            // Create the file in the file system
            var createFile = _FileSystem.createFile("swap" + program.pcb.pid);

            if (createFile.status === "error") {
                return false;
            }

            // Find the location of this process in memory
            var locationInMem = this.findLocationWithBase(program.pcb.base);
            if (locationInMem === -1) {
                return false;
            }

            // Write the file to disk
            var writeFile = _FileSystem.writeFile("swap" + program.pcb.pid, this.readProgramAtLocation(locationInMem));
            if (writeFile.status === "error") {
                return false;
            }

        }

        public findLocationWithBase(base) {
            for (var i = 0; i < this.locations.length; i++) {
                if (this.locations[i].base === base) {
                    return i;
                }
            }

            return -1;
        }


        // Grabs the memory at the base location of the current process
        public getMemory(address) {

            // We're going to check that the memory call is legal
            address += _CurrentProcess.pcb.base;

            if (address >= _CurrentProcess.pcb.limit || address < _CurrentProcess.pcb.base){
                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, address));
            }

            return this.memory.data[address];
        }

        public readProgramAtLocation()


        // Stores data into a specified address
        public storeData(data, address) {
            address += _CurrentProcess.pcb.base;

            if (address >= _CurrentProcess.pcb.limit || address < _CurrentProcess.pcb.base){
                _KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, address));
            }

            // The bytes need some formatting
            if (data.length < 2) {
                data = ('00' + data).slice(-2);
            }

            this.memory.data[address] = data.toUpperCase();
            this.updateByteOutput(address);
        }

        private updateByteOutput(address): void {
            document.getElementById('addr' + address).innerHTML = this.memory.data[address];
        }

        // Updates the memory display
        public displayMemory(): void {
            var display = '';
            var hex = '';

            for (var i = 0; i < this.memory.bytes; i++) {
                // If the location is divisible by 8, make a new row
                if (i % 8 === 0) {
                    display += '</tr><tr><th>0x';

                    // Add in some headers
                    hex = '' + i.toString(16).toUpperCase();
                    if (hex.length < 3) {
                        hex = '0' + hex;
                    }
                    display += hex + '</th>';
                }

                // then add the next column in the row
                display += '<td id="addr' + i + '"> ' + this.memory.data[i] + '</td>';
            }
            display += '</table>';
            WesterOS.Control.displayMemory(display);

        }

        // Loads the program into the actual memory at the provided location
        private loadProgramIntoMemory(programToLoad, location): void {
            var program = programToLoad.split(' ');
            var offset = location * PROGRAM_SIZE;

            // Load program
            for (var i = 0; i < program.length; i++) {
                this.memory.data[i + offset] = program[i];
            }

            // Make sure we label program as active
            this.locations[location].active = true;
        }

        // Gets the next available location for a program
        private getAvailableProgramLocation() {
            for (var i = 0; i < this.locations.length; i++) {
                if (this.locations[i].active === false) {

                    this.clearMemorySegment(i);

                    return i;
                }
            }

            return null;
        }

        // Clears a segment of memory
        private clearMemorySegment(location): void {
            // Makes sure that location is empty
            for (var x = this.locations[location].base; x < this.locations[location].limit; x++) {
                this.memory.data[x] = "00";
            }
        }

        // Clears all memory
        public clearAllMemory(): void {
            for (var i = 0; i < this.memory.bytes; i++) {
                this.memory.data[i] = "00";
            }

            for (var i = 0; i < this.locations.length; i++) {
                this.locations[i].active = false;
            }
        }

        // Removes the current process from the _ProcessList, and deletes its contents in memory
        public removeCurrentProcessFromList() {

            this.locations[_CurrentProcess.pcb.location].active = false;
            this.clearMemorySegment(_CurrentProcess.pcb.location);

        }

        // Removes a process from the _ProcessList, and deletes its contents in memory
        public removeProcessFromList(pcb) {
            this.locations[pcb.pid].active = false;
            this.clearMemorySegment(pcb.location);

        }
    }
}