/**
* The class of a process control block
*/
var WesterOS;
(function (WesterOS) {
    var Pcb = (function () {
        function Pcb() {
            // Increment after assigned
            this.pid = Pcb.globalPid++;
            // Fields for CPU usage
            this.pc = 0;
            this.acc = 0;
            this.xReg = 0;
            this.yReg = 0;
            this.zFlag = 0;
            // For memory locations
            this.base = 0;
            this.limit = 0;
            this.location = 0;
            // For priority. 10 will be the default
            this.priority = 10;
        }
        Pcb.globalPid = 0;
        return Pcb;
    })();
    WesterOS.Pcb = Pcb;
})(WesterOS || (WesterOS = {}));
