///<reference path="deviceDriver.ts" />

/**
 * Created by Kevin Pietrow.
 *
 * Handles all kernel-level I/O operations.
 */

module WesterOS {

    // Extends DeviceDriver
    export class FileSystemDeviceDriver extends DeviceDriver {

        public tracks = 0;
        public sectors = 0;
        public blocks = 0;

        // Bytes per block
        public numberOfBytes = 0;

        // How many blocks are taken up by metadata
        public metaDataBlocks = 0;
        public dataSize = 0;


        constructor() {
            // Override the base method pointers
            super(this.krnFileSystemDriverEntry(), this.krnFileSystemISR());

            // Constants for the file system
            this.tracks = 4;
            this.sectors = 8;
            this.blocks = 8;
            this.numberOfBytes = 64;
            this.metaDataBlocks = 4;
            this.dataSize = this.numberOfBytes - this.metaDataBlocks;
        }

        krnFileSystemDriverEntry() {
            // Initialization!
            this.status = "loaded";
        }

        krnFileSystemISR() {

        }

        public createFile (name) {
            var result = "";

            if (Utils.trim(name).length > this.dataSize) {
                return "ERROR: File name too long";
            }

            if (true) {}
        }

        public fileSystemReady () {
            if (!this.html5StorageSupported()) {
                return false;
            }

            try {
                return true;
            } catch (e) {
                return false;
            }
        }


        // Determines if browser supports HTML5 localStorage
        // Courtesy of: http://diveintohtml5.info/storage.html
        public html5StorageSupported () {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        }





    }
}
