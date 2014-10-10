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

        MemoryManager.prototype.displayMemory = function () {
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
        };
        return MemoryManager;
    })();
    WesterOS.MemoryManager = MemoryManager;
})(WesterOS || (WesterOS = {}));
