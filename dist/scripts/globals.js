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
var APP_NAME = "WesterOS";
var APP_VERSION = "0.117";

var CPU_CLOCK_INTERVAL = 100;

// Interupts
var TIMER_IRQ = 0;

// NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
var KEYBOARD_IRQ = 1;
var PROCESS_EXECUTION_IRQ = 2;
var UNKNOWN_OPCODE_IRQ = 3;
var MEMORY_ACCESS_VIOLATION_IRQ = 4;
var CPU_BREAK_IRQ = 5;
var SYS_OPCODE_IRQ = 6;
var CONTEXT_SWITCH_IRQ = 7;

// Setting some constants for program memory
var NUMBER_OF_PROGRAMS = 3;
var PROGRAM_SIZE = 256;

// Following Bob's lead and making this dynamic
var MEMORY_SIZE = NUMBER_OF_PROGRAMS * PROGRAM_SIZE;

//
// Global Variables
//
var _CPU;
var _CpuScheduler = null;
var _CycleCounter = 0;
var _MemoryManager = null;

var _ProcessList = null;
var _ReadyQueue = null;
var _CurrentProcess = null;

var _OSclock = 0;

var _Mode = 0;

var _Canvas = null;
var _DrawingContext = null;
var _DefaultFontFamily = "sans";
var _DefaultFontSize = 13;
var _FontHeightMargin = 4;

var _Trace = true;

// The OS Kernel and its queues.
var _Kernel;
var _KernelInterruptQueue = null;
var _KernelBuffers = null;
var _KernelInputQueue = null;

// Standard input and output
var _StdIn = null;
var _StdOut = null;

// UI
var _Console;
var _OsShell;

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;

// Global Device Driver Objects - page 12
var _krnKeyboardDriver = null;

// File System Driver
var _FileSystem = null;

var _hardwareClockID = null;

// For testing...
var _GLaDOS = null;
var Glados = null;

var onDocumentLoad = function () {
    WesterOS.Control.hostInit();
};
