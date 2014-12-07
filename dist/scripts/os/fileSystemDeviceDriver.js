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
            _super.call(this, this.krnFileSystemDriverEntry, this.krnFileSystemISR);
            this.tracks = 0;
            this.sectors = 0;
            this.blocks = 0;
            // Bytes per block
            this.numberOfBytes = 0;
            // How many bytes are taken up by metadata in a block
            this.metaDataBytes = 0;
            this.dataSize = 0;

            // Constants for the file system
            this.tracks = 4;
            this.sectors = 8;
            this.blocks = 8;
            this.numberOfBytes = 64;
            this.metaDataBytes = 4;
            this.dataSize = this.numberOfBytes - this.metaDataBytes;
        }
        FileSystemDeviceDriver.prototype.krnFileSystemDriverEntry = function () {
            // Initialization!
            this.status = "loaded";
        };

        FileSystemDeviceDriver.prototype.krnFileSystemISR = function () {
        };

        // Creates a file in the file system
        FileSystemDeviceDriver.prototype.createFile = function (name) {
            var result = "";

            // Make sure name isn't too large
            if (this.formatString(name).length > this.dataSize) {
                return "ERROR: File name too long";
            }

            // Check file system's state
            if (!this.fileSystemReady()) {
                return "File system not ready. Please reformat and try again.";
            }

            // Locate the directory
            var directory = this.findDirByName(name);

            if (directory !== -1) {
                return "There is already a file with this name.";
            }

            // Find next available directory entry
            var directoryEntry = this.findNextAvailableDirectoryEntry();

            if (directoryEntry === -1) {
                return "No more available directory entries";
            }

            // Find next available file entry
            var fileEntry = this.findNextAvailableFileEntry();

            if (fileEntry === -1) {
                return "No more available file entries";
            }

            var dirMetaData = "1" + fileEntry;
            var dirData = this.formatStringForBlock(name);
            var fileMetaData = "1---";
            var fileData = this.formatStringForBlock("");

            // Time to save the data
            localStorage.setItem(directoryEntry, (dirMetaData + dirData));
            localStorage.setItem(fileEntry, (fileMetaData + fileData));

            // Update the screen
            // DO IT, DO IT NOW
            // Return success
            return "File created successfully!";
        };

        FileSystemDeviceDriver.prototype.writeFile = function (name, data) {
            // First check the file system
            if (!this.fileSystemReady()) {
                return "The file system is not ready. Please format and try again.";
            }

            // Find directory with file name
            var dir = this.findDirByName(name);
            if (dir === -1) {
                return "Could not find a file with the given name";
            }

            var dirBlock = this.readData(dir);

            // Delete any blocks already present
            this.deleteFile(name, false);
        };

        FileSystemDeviceDriver.prototype.fileSystemReady = function () {
            if (!this.html5StorageSupported()) {
                return false;
            }

            try  {
                for (var track = 0; track < this.tracks; track++) {
                    for (var sector = 0; sector < this.sectors; sector++) {
                        for (var block = 0; block < this.blocks; block++) {
                            // Make a key, and find the item at that key
                            var key = this.makeKey(track, sector, block);
                            var data = localStorage.getItem(key);

                            // If null, something isn't set up correctly
                            if (data === null) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            } catch (e) {
                return false;
            }
        };

        FileSystemDeviceDriver.prototype.findNextAvailableDirectoryEntry = function () {
            for (var sector = 0; sector < this.sectors; sector++) {
                for (var block = 0; block < this.blocks; block++) {
                    var key = this.makeKey(0, sector, block);
                    var data = this.readData(key);

                    if (!this.blockIsActive(data)) {
                        return key;
                    }
                }
            }

            return -1;
        };

        FileSystemDeviceDriver.prototype.findNextAvailableFileEntry = function () {
            for (var track = 1; track < this.tracks; track++) {
                for (var sector = 0; sector < this.sectors; sector++) {
                    for (var block = 0; block < this.blocks; block++) {
                        var key = this.makeKey(track, sector, block);
                        var data = this.readData(key);

                        if (!this.blockIsActive(data)) {
                            return key;
                        }
                    }
                }
            }

            return -1;
        };

        FileSystemDeviceDriver.prototype.readData = function (key) {
            var data = localStorage.getItem(key);
            var value = { "key": key, "meta": "", "data": "" };

            if (data !== null) {
                for (var i = 0; i < this.metaDataBytes; i++) {
                    value.meta += data.charAt(i);
                }

                for (var i = this.metaDataBytes; i < data.length; i += 2) {
                    var ascii = parseInt(data.charAt(i) + data.charAt(i + 1), 16);

                    if (ascii !== 0) {
                        value.data += String.fromCharCode(ascii);
                    }
                }
            }

            return value;
        };

        // Discovers whether or not a block is currently active
        FileSystemDeviceDriver.prototype.blockIsActive = function (block) {
            var activeBit = block.meta.slice(0, 1);

            if (activeBit === "0") {
                return false;
            }

            return true;
        };

        // Finds a directory with the provided name
        FileSystemDeviceDriver.prototype.findDirByName = function (name) {
            for (var sector = 0; sector < this.sectors; sector++) {
                for (var block = 0; block < this.blocks; block++) {
                    var key = this.makeKey(0, sector, block);
                    var data = this.readData(key);

                    if (data.data === name) {
                        return key;
                    }
                }
            }

            return -1;
        };

        // Deletes a file, and possibly the directory listing as wel
        FileSystemDeviceDriver.prototype.deleteFile = function (name, deleteDirListing) {
            // Check file system state
            if (!this.fileSystemReady()) {
                return "The file system is not ready. Please format and try again.";
            }

            if (name === "MBR") {
                if (_SarcasticMode) {
                    return "Wat.";
                } else {
                    return "Cannot delete the MBR";
                }
            }
            // Find directory with the fil
        };

        // Creates a full ID for a specific block
        FileSystemDeviceDriver.prototype.makeKey = function (track, sector, block) {
            return String(track) + String(sector) + String(block);
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

        FileSystemDeviceDriver.prototype.formatString = function (str) {
            var formattedString = "";

            for (var i = 0; i < str.length; i++) {
                formattedString += str.charCodeAt(i).toString(16);
            }

            return formattedString;
        };

        FileSystemDeviceDriver.prototype.padWithZeros = function () {
            var zeros = "";

            for (var i = 0; i < this.numberOfBytes; i++) {
                zeros += "0";
            }

            return zeros;
        };

        FileSystemDeviceDriver.prototype.padDataString = function (str) {
            var zeros = this.padWithZeros();
            return (str + zeros).slice(0, this.dataSize);
        };

        FileSystemDeviceDriver.prototype.formatStringForBlock = function (str) {
            return this.padDataString(this.formatString(str));
        };
        return FileSystemDeviceDriver;
    })(WesterOS.DeviceDriver);
    WesterOS.FileSystemDeviceDriver = FileSystemDeviceDriver;
})(WesterOS || (WesterOS = {}));
