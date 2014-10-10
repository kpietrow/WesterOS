/**
 * Manages host memory
 */

module WesterOS {
    export class MemoryManager {

        // Create the memory
        public memory = new Memory(MEMORY_SIZE);
        public locations = new Array(NUMBER_OF_PROGRAMS);

        constructor() {
            for (var i = 0; i < this.locations; i++) {
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

        private displayMemory(): void {
            var display = '<h4>Memory</h4><table id="memory" class="table table-bordered">';
            var hex = '';

            for (var i = 0; i < 256; i++) {
                if (i % 8 === 0) {
                    display += '</tr><tr><th>0x';
                    hex = '' + i.toString(16).toUpperCase();
                    if (hex.length < 3) {
                        hex = '0' + hex;
                    }
                    display += hex + '</th>';
                }

                display += '<td data-id="' + i + '"> ' + this.memory.data[i] + '</td>';
            }
            display += '</table>';
            document.getElementById("divMemory").innerHTML = display;

        }
    }
}