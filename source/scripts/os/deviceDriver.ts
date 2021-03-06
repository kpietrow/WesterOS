/* ------------------------------
 DeviceDriver.ts

 The "base class" for all Device Drivers.
 ------------------------------ */

module WesterOS {
    export class DeviceDriver {
        public version = '0.117';
        public status = 'unloaded';
        public preemptable = false;

        constructor(public driverEntry = null,
                    public isr = null) {

        }
    }
}