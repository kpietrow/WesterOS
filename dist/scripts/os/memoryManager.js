/**
* Manages host memory
*/
var WesterOS;
(function (WesterOS) {
    var MemoryManager = (function () {
        function MemoryManager() {
            // Create the memory
            this.memory = new WesterOS.Memory(MEMORY_SIZE);
            this.locations = new Array(NUMBER_OF_PROGRAMS);
            for (var i = 0; i < this.locations.length; i++) {
                this.locations[i] = {
                    active: false,
                    base: i * PROGRAM_SIZE,
                    limit: (i + 1) * PROGRAM_SIZE
                };
            }
        }
        MemoryManager.prototype.init = function () {
            this.displayMemory();
        };

        // Load program from the User Input
        MemoryManager.prototype.loadProgram = function (program, priority) {
            var programLocation = this.getAvailableProgramLocation();

            // Main memory is full, try to put it into the file system
            if (programLocation === null) {
                var pcb = new WesterOS.Pcb();
                var file = _FileSystem.createFile("swap" + pcb.pid);

                if (file.status === "error") {
                    _StdOut.putText("ERROR: No available program locations are left in memory or in the file system");
                    return null;
                }

                var write = _FileSystem.writeFile("swap" + pcb.pid, program);

                if (write.status === "error") {
                    _StdOut.putText(write.message);
                    return null;
                }

                pcb.location = -1;
                pcb.priority = priority;

                _ProcessList[pcb.pid] = { pcb: pcb, state: "NEW" };

                return pcb.pid;
            } else {
                // Create PCB for process
                var thisPcb = new WesterOS.Pcb();

                // Determines the base location in memory for the program
                thisPcb.base = ((programLocation + 1) * PROGRAM_SIZE) - PROGRAM_SIZE;

                // Determines the upper bound of the new program
                thisPcb.limit = ((programLocation + 1) * PROGRAM_SIZE) - 1;

                thisPcb.location = programLocation;
                thisPcb.priority = priority;

                // Load the program into memory
                this.loadProgramIntoMemory(program, programLocation);

                // Have a process list with every loaded program
                _ProcessList[thisPcb.pid] = {
                    pcb: thisPcb,
                    state: "NEW"
                };

                return thisPcb.pid;
            }
        };

        // Moves process to the file system
        MemoryManager.prototype.rollOut = function (program) {
            _Kernel.krnTrace("Rolling out PID: " + program.pcb.pid);

            // Create the file in the file system
            var createFile = _FileSystem.createFile("swap" + program.pcb.pid);

            if (createFile.status === "error") {
                return false;
            }

            // Find the location of this process in memory
            var locationInMem = program.pcb.location;
            if (locationInMem === -1) {
                return false;
            }

            // Write the file to disk
            var writeFile = _FileSystem.writeFile("swap" + program.pcb.pid, this.readProgramAtLocation(locationInMem));
            if (writeFile.status === "error") {
                return false;
            }

            // Mark the location as inactive
            this.locations[locationInMem].active = false;

            // Update the process state to reflect changes in the base and limit
            program.pcb.base = -1;
            program.pcb.limit = -1;
            program.pcb.location = -1;

            // Update the view
            // todo: UPDATE (although this should probs happen automatically in the kernel)
            return true;
        };

        // Moves process out of the file system
        MemoryManager.prototype.rollIn = function (program) {
            _Kernel.krnTrace("Rolling in PID: " + program.pcb.pid);

            // Ensure that we have a spot in memory
            var programLocation = this.getAvailableProgramLocation();
            if (programLocation === null) {
                return false;
            }

            // Read in the process from the file system
            var fileFromDisk = _FileSystem.readFile("swap" + program.pcb.pid);
            if (fileFromDisk.status === "error") {
                return false;
            }

            // Bring the process into memory
            this.loadProgramIntoMemory(fileFromDisk.data, programLocation);

            // Remove the process from the file system
            var deleteProcess = _FileSystem.deleteFile("swap" + program.pcb.pid, true);
            if (deleteProcess.status === "error") {
                return false;
            }

            // Update the process state
            program.pcb.base = this.locations[programLocation].base;
            program.pcb.limit = this.locations[programLocation].limit;
            program.pcb.location = programLocation;

            // Update to screen
            // todo: do it, DO IT NOW
            return true;
        };

        // Grabs the memory at the base location of the current process
        MemoryManager.prototype.getMemory = function (address) {
            // We're going to check that the memory call is legal
            address += _CurrentProcess.pcb.base;

            if (address >= _CurrentProcess.pcb.limit || address < _CurrentProcess.pcb.base) {
                _KernelInterruptQueue.enqueue(new WesterOS.Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, address));
            }

            return this.memory.data[address];
        };

        MemoryManager.prototype.readProgramAtLocation = function (location) {
            var program = "";
            for (var i = this.locations[location].base; i < this.locations[location].limit; i++) {
                program += this.memory.data[i] + " ";
            }

            return program.slice(0, -1);
        };

        // Stores data into a specified address
        MemoryManager.prototype.storeData = function (data, address) {
            address += _CurrentProcess.pcb.base;

            if (address >= _CurrentProcess.pcb.limit || address < _CurrentProcess.pcb.base) {
                _KernelInterruptQueue.enqueue(new WesterOS.Interrupt(MEMORY_ACCESS_VIOLATION_IRQ, address));
            }

            // The bytes need some formatting
            if (data.length < 2) {
                data = ('00' + data).slice(-2);
            }

            this.memory.data[address] = data.toUpperCase();
            this.updateByteOutput(address);
        };

        MemoryManager.prototype.updateByteOutput = function (address) {
            document.getElementById('addr' + address).innerHTML = this.memory.data[address];
        };

        // Updates the memory display
        MemoryManager.prototype.displayMemory = function () {
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
        };

        // Loads the program into the actual memory at the provided location
        MemoryManager.prototype.loadProgramIntoMemory = function (programToLoad, location) {
            var program = programToLoad.split(' ');
            var offset = location * PROGRAM_SIZE;

            for (var i = 0; i < program.length; i++) {
                this.memory.data[i + offset] = program[i];
            }

            // Make sure we label program as active
            this.locations[location].active = true;
        };

        // Gets the next available location for a program
        MemoryManager.prototype.getAvailableProgramLocation = function () {
            for (var i = 0; i < this.locations.length; i++) {
                if (this.locations[i].active === false) {
                    this.clearMemorySegment(i);

                    return i;
                }
            }

            return null;
        };

        // Clears a segment of memory
        MemoryManager.prototype.clearMemorySegment = function (location) {
            for (var x = this.locations[location].base; x < this.locations[location].limit; x++) {
                this.memory.data[x] = "00";
            }
        };

        // Clears all memory
        MemoryManager.prototype.clearAllMemory = function () {
            for (var i = 0; i < this.memory.bytes; i++) {
                this.memory.data[i] = "00";
            }

            for (var i = 0; i < this.locations.length; i++) {
                this.locations[i].active = false;
            }
        };

        // Removes the current process from the _ProcessList, and deletes its contents in memory
        MemoryManager.prototype.removeCurrentProcessFromList = function () {
            // Success?
            var removed = false;
            var pcb = _CurrentProcess.pcb;

            for (var i = 0; i < _ProcessList.length; i++) {
                if (_ProcessList[i] && _ProcessList[i].pcb.pid === pcb.pid) {
                    if (pcb.location === -1) {
                        // Delete the process on the hard drive
                        _FileSystem.deleteFile("swap" + pcb.pid, true);
                    } else {
                        // Mark the location in memory as available
                        this.locations[pcb.location].active = false;
                    }

                    // Remove it from the ProcessList
                    _ProcessList.splice(i, 1);
                    removed = true;
                }
            }
            return removed;
        };

        // Removes a process from the _ProcessList, and deletes its contents in memory
        MemoryManager.prototype.removeProcessFromList = function (pcb) {
            // Success?
            var removed = false;

            for (var i = 0; i < _ProcessList.length; i++) {
                if (_ProcessList[i] && _ProcessList[i].pcb.pid === pcb.pid) {
                    if (pcb.location === -1) {
                        // Delete the process on the hard drive
                        _FileSystem.deleteFile("swap" + pcb.pid, true);
                    } else {
                        // Mark the location in memory as available
                        this.locations[pcb.location].active = false;
                    }

                    // Remove it from the ProcessList
                    _ProcessList.splice(i, 1);
                    removed = true;
                }
            }
            return removed;
        };
        return MemoryManager;
    })();
    WesterOS.MemoryManager = MemoryManager;
})(WesterOS || (WesterOS = {}));
