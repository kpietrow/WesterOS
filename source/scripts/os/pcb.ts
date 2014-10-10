/**
 * The class of a process control block
 */

module WesterOS {
    export class Pcb {
        // An updated pid counter
        static globalPid = 0;

        // Increment after assigned
        public pid = Pcb.globalPid++;

        // Fields for CPU usage
        public pc = 0;
        public acc = 0;
        public xReg = 0;
        public yReg = 0;
        public zFlag = 0;

        // For memory locations
        public base = 0;
        public limit = 0;

        constructor() {
        }

    }
}