///<reference path="deviceDriver.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
* Created by Kevin Pietrow.
*
* Handles all kernel-level I/O operations.
*/
var WesterOS;
(function (WesterOS) {
    // Extends DeviceDriver
    var FileSystemDeviceDriver = (function (_super) {
        __extends(FileSystemDeviceDriver, _super);
        function FileSystemDeviceDriver() {
            // Override the base method pointers
            _super.call(this, this.krnFileSystemDriverEntry(), this.krnFileSystemISR());
            this.tracks = 0;
            this.sectors = 0;
            this.blocks = 0;
            // Bytes per block
            this.numberOfBytes = 0;
            // How many blocks are taken up by metadata
            this.metaDataBlocks = 0;
            this.dataSize = 0;

            // Constants for the file system
            this.tracks = 4;
            this.sectors = 8;
            this.blocks = 8;
            this.numberOfBytes = 64;
            this.metaDataBlocks = 4;
            this.dataSize = this.numberOfBytes - this.metaDataBlocks;
        }
        FileSystemDeviceDriver.prototype.krnFileSystemDriverEntry = function () {
            // Initialization!
            this.status = "loaded";
        };

        FileSystemDeviceDriver.prototype.krnFileSystemISR = function () {
        };

        FileSystemDeviceDriver.prototype.createFile = function (name) {
            var result = "";

            if (WesterOS.Utils.trim(name).length > this.dataSize) {
                return "ERROR: File name too long";
            }

            if (true) {
            }
        };

        FileSystemDeviceDriver.prototype.fileSystemReady = function () {
            if (!this.html5StorageSupported()) {
                return false;
            }

            try  {
                return true;
            } catch (e) {
                return false;
            }
        };

        // Determines if browser supports HTML5 localStorage
        // Courtesy of: http://diveintohtml5.info/storage.html
        FileSystemDeviceDriver.prototype.html5StorageSupported = function () {
            try  {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        };
        return FileSystemDeviceDriver;
    })(WesterOS.DeviceDriver);
    WesterOS.FileSystemDeviceDriver = FileSystemDeviceDriver;
})(WesterOS || (WesterOS = {}));
