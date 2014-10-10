/**
 * The class of the host memory
 */

module WesterOS {
    export class Memory {
        public data = new Array();
        public bytes : number;

        constructor(bytes) {
            this.bytes = bytes;
            this.init();
        }

        private init(): void {
            for (var i = 0; i < this.bytes; i++) {
                this.data[i] = "00";
            }
        }
    }
}