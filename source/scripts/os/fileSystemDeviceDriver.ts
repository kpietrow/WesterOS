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

        // How many bytes are taken up by metadata in a block
        public metaDataBytes = 0;
        public dataSize = 0;


        constructor() {
            // Override the base method pointers
            super(this.krnFileSystemDriverEntry, this.krnFileSystemISR);

            // Constants for the file system
            this.tracks = 4;
            this.sectors = 8;
            this.blocks = 8;
            this.numberOfBytes = 64;
            this.metaDataBytes = 4;
            this.dataSize = this.numberOfBytes - this.metaDataBytes;
        }

        public krnFileSystemDriverEntry() {
            // Initialization!
            this.status = "loaded";
        }

        public krnFileSystemISR() {

        }

        // Creates a file in the file system
        public createFile (name) {
            var result = { "status" : "error", "message" : "", "data" : "" };

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

            // Return success
            result.status = "Success";
            result.message = "File created successfully!"
            return result;
        }

        public writeFile(name, data) {
            var result = { "status" : "error", "message" : "", "data" : "" };

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
                result.message = "ERROR: Not enough space on disk to write full file"
                return result;
            }

            // todo: Update display and print success

            result.status = "Success";
            result.message = "File successfully written to";
            return result;
        }

        // Deletes a file, and possibly the directory listing as wel
        public deleteFile(name, deleteDirListing) {
            // Check file system state
            if (!this.fileSystemReady()) {
                return "ERROR: The file system is not ready. Please format and try again.";
            }

            if (name === "MBR") {
                if (_SarcasticMode) {
                    result.message = "ERROR: Wat.";
                    return result
                } else {
                    result.message = "ERROR: Cannot delete the MBR";
                }
            }

            // Find directory with the file name
            var dir = this.findDirByName(name);
            if (dir === -1) {
                return "ERROR: Could not find a file with the given name";
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

            // Find out which blocks to delete
            while (this.blockHasLink(currentBlock.meta)) {
                affectedBlocks.push(this.getChainAddress(currentBlock));
                currentBlock = this.readData(this.getChainAddress(currentBlock));
            }

            // Zero out the data
            for (var i = 0; i < affectedBlocks.length; i++) {
                localStorage.setItem((affectedBlocks[i], zeroedData));
            }

            // Print it
            // todo: PRINT IT NOW

            return "Successfully deleted the specified file";
        }


        // Reads a specified file
        public readFile(name) {
            // Check file system
            if (!this.fileSystemReady()) {
                return "ERROR: Could not find a file with the given name"
            }

            // Find directory with file name
            var dir = this.findDirByName(name);

            if (dir === -1) {
                return "ERROR: Could not find file with given name";
            }

            var dirBlock = this.readData(dir);
            var dirData = this.readBlocks(this.getChainAddress(dirBlock));

            // todo: RETURN RESULTS

            return "Success!";

        }



        // Write some data ja
        public handleWriteData (dirBlock, data) {
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
        }

        // Reads in all linked blocks starting with the key
        public readBlocks (key) {
            var currentData = this.readData(key);
            var returnString = currentData.data;

            while (this.blockHasLink(currentData.meta)) {
                currentData = this.readData(this.getChainAddress(currentData));
                returnString += currentData.data;
            }

            return returnString;
        }

        // Formats the file system
        public format() {
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

            return true;
        }

        public createMBR() {
            var dirBlock = this.readData(this.makeKey(0, 0, 0));

            // Write MBR to file system
            var successfulWrite = this.handleWriteData(dirBlock, "MBR");
        }


        public fileSystemReady () {
            if (!this.html5StorageSupported()) {
                return false;
            }

            try {
                // Loop through each block of memory
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
        }

        public findNextAvailableDirectoryEntry() {
            // Searching through metadata in track 0
            for (var sector = 0; sector < this.sectors; sector++) {
                for (var block = 0; block < this.blocks; block++) {
                    var key = this.makeKey(0, sector, block);
                    var data = this.readData(key)

                    if (!this.blockIsActive(data)) {
                        return key;
                    }
                }
            }

            return -1
        }

        public findNextAvailableFileEntry() {
            // Metadata is in track 0, file data starts in track 1
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
        }

        public readData(key) {
            var data = localStorage.getItem(key);
            var value = { "key" : key, "meta" : "", "data" : ""};

            if (data !== null) {
                // Read in first 4 bits of metadata
                for (var i = 0; i < this.metaDataBytes; i++) {
                    value.meta += data.charAt(i);
                }

                // Parses in hex, 2 digits at a time
                for (var i = this.metaDataBytes; i < data.length; i+= 2) {
                    var ascii = parseInt(data.charAt(i) + data.charAt(i + 1), 16);

                    if (ascii !== 0) {
                        value.data += String.fromCharCode(ascii);
                    }
                }
            }

            return value;
        }

        // Discovers whether or not a block is currently active
        public blockIsActive (block) {
            var activeBit = block.meta.slice(0, 1);

            if (activeBit === "0") {
                return false;
            }

            return true;
        }

        // Finds a directory with the provided name
        public findDirByName(name) {
            // Only searching through the metadata in track 0

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
        }

        public blockHasLink(metaData) {
            var link = metaData.substring(1, this.metaDataBytes);
            if (link !== "" && link !== "---") {
                return true;
            }

            return false;
        }



        // Creates a full ID for a specific block
        public makeKey (track, sector, block) {
            return String(track) + String(sector) + String(block);
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

        public getChainAddress(block) {
            return block.meta.slice(1, this.metaDataBytes);
        }

        public formatString (str) {
            var formattedString = "";

            for (var i = 0; i < str.length; i++) {
                formattedString += str.charCodeAt(i).toString(16);
            }

            return formattedString;
        }

        public padWithZeros () {
            var zeros = "";

            for (var i = 0; i < this.numberOfBytes; i++) {
                zeros += "0";
            }

            return zeros;
        }

        public padDataString (str) {
            var zeros = this.padWithZeros();
            return (str + zeros).slice(0, this.dataSize);
        }

        public formatStringForBlock(str) {
            return this.padDataString(this.formatString(str));
        }

    }
}
