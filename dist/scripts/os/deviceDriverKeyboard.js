///<reference path="deviceDriver.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/* ----------------------------------
DeviceDriverKeyboard.ts
Requires deviceDriver.ts
The Kernel Keyboard Device Driver.
---------------------------------- */
var WesterOS;
(function (WesterOS) {
    // Extends DeviceDriver
    var DeviceDriverKeyboard = (function (_super) {
        __extends(DeviceDriverKeyboard, _super);
        function DeviceDriverKeyboard() {
            // Override the base method pointers.
            _super.call(this, this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            this.shiftSymbolKeys = [];
            this.symbolKeys = [];
            this.setSymbolKeys();
            this.setShiftSymbolKeys();
        }
        DeviceDriverKeyboard.prototype.setSymbolKeys = function () {
            this.symbolKeys[186] = 59; // ;
            this.symbolKeys[187] = 61; // =
            this.symbolKeys[188] = 44; // ,
            this.symbolKeys[189] = 45; // -
            this.symbolKeys[190] = 46; // .
            this.symbolKeys[191] = 47; // /
            this.symbolKeys[192] = 96; // `
            this.symbolKeys[219] = 91; // [
            this.symbolKeys[220] = 92; // \
            this.symbolKeys[221] = 93; // ]
            this.symbolKeys[222] = 39; // '
        };

        DeviceDriverKeyboard.prototype.setShiftSymbolKeys = function () {
            this.shiftSymbolKeys[48] = 41; // )
            this.shiftSymbolKeys[49] = 33; // !
            this.shiftSymbolKeys[50] = 64; // @
            this.shiftSymbolKeys[51] = 35; // #
            this.shiftSymbolKeys[52] = 36; // $
            this.shiftSymbolKeys[53] = 37; // %
            this.shiftSymbolKeys[54] = 94; // ^
            this.shiftSymbolKeys[55] = 38; // &
            this.shiftSymbolKeys[56] = 42; // *
            this.shiftSymbolKeys[57] = 40; // (
            this.shiftSymbolKeys[59] = 58; // :
            this.shiftSymbolKeys[61] = 43; // +
            this.shiftSymbolKeys[173] = 95; // _
            this.shiftSymbolKeys[188] = 60; // <
            this.shiftSymbolKeys[190] = 62; // >
            this.shiftSymbolKeys[191] = 63; // ?
            this.shiftSymbolKeys[192] = 126; // ~
            this.shiftSymbolKeys[219] = 123; // {
            this.shiftSymbolKeys[220] = 124; // |
            this.shiftSymbolKeys[221] = 125; // }
            this.shiftSymbolKeys[222] = 34; // "
        };

        DeviceDriverKeyboard.prototype.krnKbdDriverEntry = function () {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        };

        DeviceDriverKeyboard.prototype.krnKbdDispatchKeyPress = function (params) {
            // Parse the params.    TODO: Check that they are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];

            // Throw an error if we receive bad parameters
            if (keyCode === null || isShifted === null || typeof keyCode !== "number" || typeof isShifted !== "boolean") {
                WesterOS.Kernel.trapError("Invalid user input to keyboard");
                return;
            }

            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr = "";

            // Check to see if we even want to deal with the key that was pressed.
            if (((keyCode >= 65) && (keyCode <= 90)) || ((keyCode >= 97) && (keyCode <= 123))) {
                // Determine the character we want to display.
                // Assume it's lowercase...
                chr = String.fromCharCode(keyCode + 32);

                // ... then check the shift key and re-adjust if necessary.
                if (isShifted) {
                    chr = String.fromCharCode(keyCode);
                }

                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);
            } else if (((keyCode >= 48) && (keyCode <= 57)) || (keyCode == 32) || (keyCode == 59) || (keyCode == 61) || (keyCode == 13)) {
                chr = String.fromCharCode(keyCode);

                if (isShifted) {
                    chr = String.fromCharCode(this.shiftSymbolKeys[keyCode]);
                }
                _KernelInputQueue.enqueue(chr);
                // Grabs backspaces, and tabs
            } else if (keyCode == 8 || keyCode == 9) {
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
            } else if (!isShifted && (keyCode == 38 || keyCode == 40)) {
                chr = (keyCode === 38) ? "UP" : "DOWN";
                _KernelInputQueue.enqueue(chr);
                // Punctuation
            } else if ((keyCode == 173) || (keyCode == 188) || (keyCode >= 190 && keyCode <= 192) || (keyCode >= 219 && keyCode <= 222)) {
                chr = String.fromCharCode(this.symbolKeys[keyCode]);
                if (isShifted) {
                    chr = String.fromCharCode(this.shiftSymbolKeys[keyCode]);
                }

                _KernelInputQueue.enqueue(chr);
            }
        };
        return DeviceDriverKeyboard;
    })(WesterOS.DeviceDriver);
    WesterOS.DeviceDriverKeyboard = DeviceDriverKeyboard;
})(WesterOS || (WesterOS = {}));
