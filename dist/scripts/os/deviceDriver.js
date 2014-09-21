/* ------------------------------
DeviceDriver.ts
The "base class" for all Device Drivers.
------------------------------ */
var WesterOS;
(function (WesterOS) {
    var DeviceDriver = (function () {
        function DeviceDriver(driverEntry, isr) {
            if (typeof driverEntry === "undefined") { driverEntry = null; }
            if (typeof isr === "undefined") { isr = null; }
            this.driverEntry = driverEntry;
            this.isr = isr;
            this.version = '0.117';
            this.status = 'unloaded';
            this.preemptable = false;
        }
        return DeviceDriver;
    })();
    WesterOS.DeviceDriver = DeviceDriver;
})(WesterOS || (WesterOS = {}));
