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
            this.status = "unloaded";

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
            WesterOS.Control.displayHardDrive();
        };

        FileSystemDeviceDriver.prototype.krnFileSystemISR = function () {
        };

        // Creates a file in the file system
        FileSystemDeviceDriver.prototype.createFile = function (name) {
            var result = { "status": "error", "message": "", "data": "" };

            // Make sure name isn't too large
            if (this.formatString(name).length > this.dataSize) {
                result.message = "ERROR: File name too long";
                return result;
            }

            // Check file system's state
            if (!this.fileSystemReady()) {
                result.message = "ERROR: File system not ready. Please reformat and try again.";
                return;
            }

            console.debug(name);

            // Locate the directory
            var directory = this.findDirByName(name);

            if (directory !== -1) {
                result.message = "ERROR: There is already a file with this name.";
                return result;
            }

            // Find next available directory entry
            var directoryEntry = this.findNextAvailableDirectoryEntry();

            if (directoryEntry === -1) {
                result.message = "ERROR: No more available directory entries";
                return result;
            }

            // Find next available file entry
            var fileEntry = this.findNextAvailableFileEntry();

            if (fileEntry === -1) {
                result.message = "ERROR: No more available file entries";
                return result;
            }

            var dirMetaData = "1" + fileEntry;
            var dirData = this.formatStringForBlock(name);
            var fileMetaData = "1---";
            var fileData = this.formatStringForBlock("");

            // Time to save the data
            localStorage.setItem(directoryEntry, (dirMetaData + dirData));
            localStorage.setItem(fileEntry, (fileMetaData + fileData));

            // Update the screen
            // todo: DO IT, DO IT NOW
            WesterOS.Control.displayHardDrive();

            // Return success
            result.status = "Success";
            result.message = "File created successfully!";
            return result;
        };

        FileSystemDeviceDriver.prototype.writeFile = function (name, data) {
            var result = { "status": "error", "message": "", "data": "" };

            // First check the file system
            if (!this.fileSystemReady()) {
                result.message = "ERROR: The file system is not ready. Please format and try again.";
                return result;
            }

            // Find directory with file name
            var dir = this.findDirByName(name);
            if (dir === -1) {
                result.message = "ERROR: Could not find a file with the given name";
                return result;
            }

            var dirBlock = this.readData(dir);

            // Delete any blocks already present
            this.deleteFile(name, false);

            // Write the data
            var successfulWrite = this.handleWriteData(dirBlock, data);

            if (!successfulWrite) {
                result.message = "ERROR: Not enough space on disk to write full file";
                return result;
            }

            // todo: Update display and print success
            WesterOS.Control.displayHardDrive();

            result.status = "Success";
            result.message = "File successfully written to";
            return result;
        };

        // Deletes a file, and possibly the directory listing as wel
        FileSystemDeviceDriver.prototype.deleteFile = function (name, deleteDirListing) {
            var result = { "status": "error", "message": "", "data": "" };

            // Check file system state
            if (!this.fileSystemReady()) {
                result.message = "ERROR: The file system is not ready. Please format and try again.";
                return result;
            }

            if (name === "MBR") {
                if (_SarcasticMode) {
                    result.message = "ERROR: Wat.";
                    return result;
                } else {
                    result.message = "ERROR: Cannot delete the MBR";
                    return result;
                }
            }

            // Find directory with the file name
            var dir = this.findDirByName(name);
            if (dir === -1) {
                result.message = "ERROR: Could not find a file with the given name";
                return result;
            }

            var currentBlock = this.readData(dir);
            var zeroedData = this.padWithZeros();
            var affectedBlocks = [this.getChainAddress(currentBlock)];

            // Delete the directory listing if from the shell command,
            // and leave it if we're just writing
            if (deleteDirListing) {
                // Add dir listing to currentBlocks
                affectedBlocks.push(currentBlock.key);
            }

            while (this.blockHasLink(currentBlock.meta)) {
                affectedBlocks.push(this.getChainAddress(currentBlock));
                currentBlock = this.readData(this.getChainAddress(currentBlock));
            }

            for (var i = 0; i < affectedBlocks.length; i++) {
                localStorage.setItem(affectedBlocks[i], zeroedData);
            }

            // Print it
            // todo: PRINT IT NOW
            WesterOS.Control.displayHardDrive();

            result.status = "Success";
            result.message = "File was successfully deleted";
            return result;
        };

        // Reads a specified file
        FileSystemDeviceDriver.prototype.readFile = function (name) {
            var result = { "status": "error", "message": "", "data": "" };

            // Check file system
            if (!this.fileSystemReady()) {
                result.message = "ERROR: Could not find a file with the given name";
                return result;
            }

            // Find directory with file name
            var dir = this.findDirByName(name);

            if (dir === -1) {
                result.message = "ERROR: Could not find file with given name";
                return result;
            }

            var dirBlock = this.readData(dir);
            var dirData = this.readBlocks(this.getChainAddress(dirBlock));

            result.status = "Success";
            result.message = "File contents read successfully";
            result.data = dirData;
            return result;
        };

        // Write some data ja
        FileSystemDeviceDriver.prototype.handleWriteData = function (dirBlock, data) {
            var encodedData = this.formatString(data);
            var encodedDataBlocks = [];

            while (encodedData.length) {
                // Separate data and pad with zeroes
                encodedDataBlocks.push(this.padDataString(encodedData.slice(0, this.dataSize)));
                encodedData = encodedData.slice(this.dataSize);
            }

            // Iterate over the new blocks array, track which blocks point
            // to others
            var currentBlockPointsTo = this.getChainAddress(dirBlock);
            var lastBlock = "---";

            for (var i = 0; i < encodedDataBlocks.length; i++) {
                if (currentBlockPointsTo === -1) {
                    // Ran out of space
                    // Not so good
                    return false;
                }

                // Write to file system
                localStorage.setItem(currentBlockPointsTo, ("1---" + encodedDataBlocks[i]));

                // Check if metadata needs updating
                if (lastBlock !== "---") {
                    var lastBlockData = localStorage.getItem(lastBlock).slice(4);
                    var lastBlockMetaData = "1" + currentBlockPointsTo;
                    localStorage.setItem(lastBlock, (lastBlockMetaData + lastBlockData));
                }

                // Advance pointers
                lastBlock = currentBlockPointsTo;
                currentBlockPointsTo = this.findNextAvailableFileEntry();
            }

            return true;
        };

        // Reads in all linked blocks starting with the key
        FileSystemDeviceDriver.prototype.readBlocks = function (key) {
            var currentData = this.readData(key);
            var returnString = currentData.data;

            while (this.blockHasLink(currentData.meta)) {
                currentData = this.readData(this.getChainAddress(currentData));
                returnString += currentData.data;
            }

            return returnString;
        };

        // Formats the file system
        FileSystemDeviceDriver.prototype.format = function () {
            if (!this.html5StorageSupported()) {
                return false;
            }

            var zeroedData = this.padWithZeros();

            for (var track = 0; track < this.tracks; track++) {
                for (var sector = 0; sector < this.sectors; sector++) {
                    for (var block = 0; block < this.blocks; block++) {
                        localStorage.setItem(this.makeKey(track, sector, block), zeroedData);
                    }
                }
            }

            this.createMBR();

            // PRINT IT
            // todo: PRINT IT NOW
            WesterOS.Control.displayHardDrive();

            return true;
        };

        FileSystemDeviceDriver.prototype.listDirectory = function () {
            var result = { "status": "error", "message": "", "data": [] };

            // Check file system
            if (!this.fileSystemReady()) {
                result.message = "ERROR: The file system is not ready. Please format and try again.";
                return result;
            }

            for (var sector = 0; sector < this.sectors; sector++) {
                for (var block = 0; block < this.blocks; block++) {
                    var key = this.makeKey(0, sector, block);
                    var data = this.readData(key);

                    if (this.blockIsActive(data)) {
                        result.data.push({ "key": data.key, "name": data.data });
                    }
                }
            }

            result.status = "Success";
            result.message = "The file system directory was successfully read";
            return result;
        };

        FileSystemDeviceDriver.prototype.createMBR = function () {
            var dirBlock = this.readData(this.makeKey(0, 0, 0));

            // Write MBR to file system
            var successfulWrite = this.handleWriteData(dirBlock, "MBR");
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

        FileSystemDeviceDriver.prototype.blockHasLink = function (metaData) {
            var link = metaData.substring(1, this.metaDataBytes);
            if (link !== "" && link !== "---") {
                return true;
            }

            return false;
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

        FileSystemDeviceDriver.prototype.getChainAddress = function (block) {
            return block.meta.slice(1, this.metaDataBytes);
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
