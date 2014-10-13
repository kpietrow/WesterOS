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
            if (programLocation === null) {
                _StdOut.putText('There are too many programs already in memory');
                return null;
            } else {
                // Create PCB for process
                var thisPcb = new Pcb();

                // Determines the base location in memory for the program
                thisPcb.base = ((programLocation + 1) * PROGRAM_SIZE) - PROGRAM_SIZE;
                // Determines the upper bound of the new program
                thisPcb.limit = ((programLocation + 1) * PROGRAM_SIZE) - 1;

                // Load the program into memory
                this.loadProgramIntoMemory(program, programLocation);

                return thisPcb.pid;
            }
        }

        // Updates the memory display
        private displayMemory(): void {
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
                display += '<td data-id="' + i + '"> ' + this.memory.data[i] + '</td>';
            }
            display += '</table>';
            document.getElementById("memoryTable").innerHTML = display;

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
                    return i;
                }
            }

            return null;
        }
    }
}