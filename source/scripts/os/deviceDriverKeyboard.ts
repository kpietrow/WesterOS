///<reference path="deviceDriver.ts" />

/* ----------------------------------
   DeviceDriverKeyboard.ts

   Requires deviceDriver.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

module WesterOS {

    // Extends DeviceDriver
    export class DeviceDriverKeyboard extends DeviceDriver {

        private shiftSymbolKeys = [];
        private symbolKeys = [];


        constructor() {
            // Override the base method pointers.
            super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            this.setSymbolKeys();
            this.setShiftSymbolKeys();

        }

        public setSymbolKeys() {
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
        }

        public setShiftSymbolKeys() {
            this.shiftSymbolKeys[48] = 41;   // )
            this.shiftSymbolKeys[49] = 33;   // !
            this.shiftSymbolKeys[50] = 64;   // @
            this.shiftSymbolKeys[51] = 35;   // #
            this.shiftSymbolKeys[52] = 36;   // $
            this.shiftSymbolKeys[53] = 37;   // %
            this.shiftSymbolKeys[54] = 94;   // ^
            this.shiftSymbolKeys[55] = 38;   // &
            this.shiftSymbolKeys[56] = 42;   // *
            this.shiftSymbolKeys[57] = 40;   // (
            this.shiftSymbolKeys[59] = 58;   // :
            this.shiftSymbolKeys[61] = 43;   // +
            this.shiftSymbolKeys[173] = 95;  // _
            this.shiftSymbolKeys[188] = 60;  // <
            this.shiftSymbolKeys[190] = 62;  // >
            this.shiftSymbolKeys[191] = 63;  // ?
            this.shiftSymbolKeys[192] = 126; // ~
            this.shiftSymbolKeys[219] = 123; // {
            this.shiftSymbolKeys[220] = 124; // |
            this.shiftSymbolKeys[221] = 125; // }
            this.shiftSymbolKeys[222] = 34;  // "
        }

        public krnKbdDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }

        public krnKbdDispatchKeyPress(params) {
            console.debug(params);
            console.debug(this.symbolKeys);
            // Parse the params.    TODO: Check that they are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            if (((keyCode >= 65) && (keyCode <= 90)) ||   // A..Z
                ((keyCode >= 97) && (keyCode <= 123))) {  // a..z {
                // Determine the character we want to display.
                // Assume it's lowercase...
                chr = String.fromCharCode(keyCode + 32);
                // ... then check the shift key and re-adjust if necessary.
                if (isShifted) {
                    chr = String.fromCharCode(keyCode);
                }
                // TODO: Check for caps-lock and handle as shifted if so.
                _KernelInputQueue.enqueue(chr);
            } else if (((keyCode >= 48) && (keyCode <= 57)) ||   // digits
                        (keyCode == 32)                     ||   // space
                        (keyCode == 13)) {                       // enter
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
            // Grabs backspaces, arrow key presses, and tabs
            } else if (keyCode == 8 || keyCode == 38 || keyCode == 40 || keyCode == 9) {                           // backspace
                chr = String.fromCharCode(keyCode);
                _KernelInputQueue.enqueue(chr);
            }
        }
    }
}
