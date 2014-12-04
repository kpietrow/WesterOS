/* ------------
   Globals.ts

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)

   This code references page numbers in the text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

//
// Global "CONSTANTS" (There is currently no const or final or readonly type annotation in TypeScript.)
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
//
var APP_NAME: string    = "WesterOS";   // 'cause Bob and I were at a loss for a better name.
var APP_VERSION: string = "0.117";   // What did you expect?

var CPU_CLOCK_INTERVAL: number = 100;   // This is in ms, or milliseconds, so 1000 = 1 second.


// Interupts
var TIMER_IRQ: number = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
                            // NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
var KEYBOARD_IRQ: number = 1;
var PROCESS_EXECUTION_IRQ: number = 2;
var UNKNOWN_OPCODE_IRQ: number = 3;
var MEMORY_ACCESS_VIOLATION_IRQ: number = 4;
var CPU_BREAK_IRQ: number = 5;
var SYS_OPCODE_IRQ: number = 6;
var CONTEXT_SWITCH_IRQ: number = 7;

// Setting some constants for program memory
var NUMBER_OF_PROGRAMS = 3;
var PROGRAM_SIZE = 256;
// Following Bob's lead and making this dynamic
var MEMORY_SIZE = NUMBER_OF_PROGRAMS * PROGRAM_SIZE;


//
// Global Variables
//
var _CPU: WesterOS.Cpu;  // Utilize TypeScript's type annotation system to ensure that _CPU is an instance of the Cpu class.
var _CpuScheduler = null;
var _CycleCounter = 0;
var _MemoryManager = null;

var _ProcessList = null; // Will be storing processes here until I can think of something better
var _ReadyQueue = null; // Stores processes to be run
var _CurrentProcess = null;

var _OSclock: number = 0;  // Page 23.

var _Mode: number = 0;     // (currently unused)  0 = Kernel Mode, 1 = User Mode.  See page 21.

var _Canvas: HTMLCanvasElement = null;  // Initialized in hostInit().
var _DrawingContext = null;             // Initialized in hostInit().
var _DefaultFontFamily = "sans";        // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
var _DefaultFontSize = 13;
var _FontHeightMargin = 4;              // Additional space added to font size when advancing a line.



var _Trace: boolean = true;  // Default the OS trace to be on.

// The OS Kernel and its queues.
var _Kernel: WesterOS.Kernel;
var _KernelInterruptQueue = null;
var _KernelBuffers: any[] = null;
var _KernelInputQueue = null;

// Standard input and output
var _StdIn  = null;
var _StdOut = null;

// UI
var _Console: WesterOS.Console;
var _OsShell: WesterOS.Shell;

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode: boolean = false;

// Global Device Driver Objects - page 12
var _krnKeyboardDriver = null;

// File System Driver
var _FileSystem = null;

var _hardwareClockID: number = null;

// For testing...
var _GLaDOS: any = null;
var Glados: any = null;

var onDocumentLoad = function() {
	WesterOS.Control.hostInit();
};
