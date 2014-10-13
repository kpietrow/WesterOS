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
            for (var i = 0; i < this.locations; i++) {
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
        MemoryManager.prototype.loadProgram = function (program) {
            var programLocation = this.getAvailableProgramLocation();
            if (programLocation === null) {
                // will have to figure out something to do here
            } else {
                // Create PCB for process
                var thisPcb = new WesterOS.Pcb();

                // Determines the base location in memory for the program
                thisPcb.base = ((programLocation + 1) * PROGRAM_SIZE) - PROGRAM_SIZE;

                // Determines the upper bound of the new program
                thisPcb.limit = ((programLocation + 1) * PROGRAM_SIZE) - 1;
            }
        };

        // Updates the memory display
        MemoryManager.prototype.displayMemory = function () {
            var display = '';
            var hex = '';

            for (var i = 0; i < PROGRAM_SIZE; i++) {
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
                display += '<td data-id="' + i + '"> ' + this.memory.data[i] + '</td>';
            }
            display += '</table>';
            document.getElementById("memoryTable").innerHTML = display;
        };

        // Loads the program into the actual memory at t
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
                    return i;
                }
            }

            return null;
        };
        return MemoryManager;
    })();
    WesterOS.MemoryManager = MemoryManager;
})(WesterOS || (WesterOS = {}));
