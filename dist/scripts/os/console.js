///<reference path="../globals.ts" />
/* ------------
Console.ts
Requires globals.ts
The OS Console - stdIn and stdOut by default.
Note: This is not the Shell.  The Shell is the "command line interface" (CLI) or interpreter for this console.
------------ */
var WesterOS;
(function (WesterOS) {
    var Console = (function () {
        function Console(currentFont, currentFontSize, currentXPosition, currentYPosition, buffer) {
            if (typeof currentFont === "undefined") { currentFont = _DefaultFontFamily; }
            if (typeof currentFontSize === "undefined") { currentFontSize = _DefaultFontSize; }
            if (typeof currentXPosition === "undefined") { currentXPosition = 0; }
            if (typeof currentYPosition === "undefined") { currentYPosition = _DefaultFontSize; }
            if (typeof buffer === "undefined") { buffer = ""; }
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.buffer = buffer;
        }
        Console.prototype.init = function () {
            this.clearScreen();
            this.resetXY();
            this.updateDateTime();
        };

        Console.prototype.clearScreen = function () {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        };

        Console.prototype.resetXY = function () {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        };

        Console.prototype.handleInput = function () {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();

                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) {
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);

                    // ... and reset our buffer.
                    this.buffer = "";
                    // Remove last character from the CLI, and decrease the buffer
                } else if (chr === String.fromCharCode(8)) {
                    this.removeChar(this.buffer.charAt(this.buffer.length - 1));
                    this.buffer = this.buffer.substring(0, this.buffer.length - 1);
                    // Revert to previous command
                } else if ((chr === "UP") || (chr === "DOWN")) {
                    this.removeChar(this.buffer);

                    var newCommand = _OsShell.accessHistory(chr);
                    this.buffer = newCommand;
                    this.putText(this.buffer);
                    // Tab complete
                } else if (chr === String.fromCharCode(9)) {
                    this.tabComplete();
                } else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);

                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
                // TODO: Write a case for Ctrl-C.
            }
        };

        // Removes charecter(s) from the console display
        Console.prototype.removeChar = function (text) {
            if (text !== "") {
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition - offset;

                _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - this.currentFontSize - 1, offset, this.currentFontSize * 2);
            }
        };

        Console.prototype.putText = function (text) {
            // My first inclination here was to write two functions: putChar() and putString().
            // Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
            // between the two.  So rather than be like PHP and write two (or more) functions that
            // do the same thing, thereby encouraging confusion and decreasing readability, I
            // decided to write one function and use the term "text" to connote string or char.
            // UPDATE: Even though we are now working in TypeScript, char and string remain undistinguished.
            if (text !== "") {
                for (var char in text) {
                    // protect against overshooting
                    if (this.currentXPosition > 490) {
                        this.advanceLine();
                    }

                    // Draw the text at the current X and Y coordinates.
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text[char]);

                    // Move the current X position.
                    var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text[char]);
                    this.currentXPosition = this.currentXPosition + offset;
                }
            }
        };

        Console.prototype.advanceLine = function () {
            this.currentXPosition = 0;

            /*
            * Font size measures from the baseline to the highest point in the font.
            * Font descent measures from the baseline to the lowest point in the font.
            * Font height margin is extra spacing between the lines.
            */
            this.currentYPosition += _DefaultFontSize + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + _FontHeightMargin;

            this.handleScrolling();
        };

        // Tab completion
        Console.prototype.tabComplete = function () {
            var candidate;
            var found = false;
            var possibleCommands = [];

            for (candidate in _OsShell.commandList) {
                if (_OsShell.commandList[candidate].command.lastIndexOf(this.buffer, 0) === 0) {
                    found = true;
                    possibleCommands.unshift(_OsShell.commandList[candidate].command);
                }
            }

            // If suitable candidate is found
            if (found) {
                // Single possibility, so fill prompt with the command
                if (possibleCommands.length === 1) {
                    this.removeChar(this.buffer);
                    this.buffer = possibleCommands[0];
                    this.putText(this.buffer);
                    // List possibilities, then redisplay prompt with the buffer from before
                    // Unix style, yeah
                } else {
                    this.advanceLine();

                    for (var command in possibleCommands) {
                        _StdOut.putText(possibleCommands[command] + " ");
                    }

                    this.advanceLine();
                    _OsShell.putPrompt();
                    this.putText(this.buffer);
                }
                found = false;
            }
        };

        // Handles if there is more text than space on the canvas
        Console.prototype.handleScrolling = function () {
            if (this.currentYPosition >= _Canvas.height) {
                // Get the canvas data, calculate offset
                var oldCanvasData = _DrawingContext.getImageData(0, this.currentFontSize + 8, _Canvas.width, _Canvas.height);

                // Redraw Canvas
                _DrawingContext.putImageData(oldCanvasData, 0, 0);

                // Move the current Y position
                this.currentYPosition = _Canvas.height - this.currentFontSize;
            }
        };

        // Handler for SYS software interrupt, from the CPU
        Console.prototype.handleSysOpCode = function () {
            if (_CPU.Xreg === 1) {
                // Print contents of Y reg
                this.putText(parseInt(_CPU.Yreg).toString());
                this.advanceLine();
                _OsShell.putPrompt();
            } else if (_CPU.Xreg === 2) {
                // Print the 00 terminated string. Address is in the y register
                var output = "";

                // Location in memory
                var pointer = _CPU.Yreg;

                // Current data in memory, at that location
                var data = _MemoryManager.getMemory(pointer);

                while (data !== "00") {
                    // Convert into char form
                    output += String.fromCharCode(parseInt(data, 16));
                    data = _MemoryManager.getMemory(++pointer);
                }

                this.putText(output);
                this.advanceLine();
                _OsShell.putPrompt();
            }
        };

        // bsod handled here. In the future the location of this function may have to be moved
        Console.prototype.bsod = function () {
            var display = document.getElementById("display");
            display.style.background = "url('dist/images/bsod.jpg')";
            display.style.backgroundSize = "500px 500px";
            this.clearScreen();
        };

        // Continuously updates the date and time on the top of the site
        Console.prototype.updateDateTime = function () {
            var dateTime = new Date();
            var dateString = dateTime.toDateString() + "  / " + ((dateTime.getHours() > 12) ? dateTime.getHours() - 12 : dateTime.getHours()) + ":" + ((dateTime.getMinutes() < 10) ? "0" : "") + dateTime.getMinutes() + ":" + ((dateTime.getSeconds() < 10) ? "0" : "") + dateTime.getSeconds();
            document.getElementById("dateTime").innerHTML = dateString;
            setInterval(this.updateDateTime, 1000);
        };
        return Console;
    })();
    WesterOS.Console = Console;
})(WesterOS || (WesterOS = {}));
