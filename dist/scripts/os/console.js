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
                console.debug("handle input");

                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();

                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) {
                    console.debug("enter");

                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);

                    // ... and reset our buffer.
                    this.buffer = "";
                    // Remove last character from the CLI, and decrease the buffer
                } else if (chr === String.fromCharCode(8)) {
                    console.debug("backspace");
                    this.removeChar(this.buffer.charAt(this.buffer.length - 1));
                    this.buffer = this.buffer.substring(0, this.buffer.length - 1);
                    // Revert to previous command
                } else if ((chr === String.fromCharCode(38)) || (chr === String.fromCharCode(40))) {
                    console.debug(chr);
                    this.removeChar(this.buffer);

                    var newCommand = _OsShell.accessHistory(chr);
                    this.buffer = newCommand;
                    this.putText(this.buffer);
                } else if (chr === String.fromCharCode(9)) {
                    this.tabComplete();
                } else {
                    console.debug("normal char");

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
            console.debug("we've reached removeChar");
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
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);

                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
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
            console.debug("tab complete time");
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
                var buffer = _DrawingContext.getImageData(0, 0, _Canvas.width, _Canvas.height);

                // Adjust the height. For some reason, the + 6 is enough to keep the text "treading water",
                // and not sink below the displayable area
                _Canvas.height += _DefaultFontSize + _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) + _FontHeightMargin + 6;
                var displayContainer = document.getElementById("console-display");
                displayContainer.scrollTop = displayContainer.scrollHeight;
                this.clearScreen();
                _DrawingContext.putImageData(buffer, 0, 0);
            }
        };

        // bsod handled here. In the future the location of this function may have to be moved
        Console.prototype.bsod = function () {
            var image = new Image();
            image.src = "source/styles/bsod.jpg";
            var display = document.getElementById("console-display");
            display = image;
        };
        return Console;
    })();
    WesterOS.Console = Console;
})(WesterOS || (WesterOS = {}));
