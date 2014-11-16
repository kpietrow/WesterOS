///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />
///<reference path="../utils.ts" />
/* ------------
Shell.ts
The OS Shell - The "command line interface" (CLI) for the console.
------------ */
// TODO: Write a base class / prototype for system services and let Shell inherit from it.
var WesterOS;
(function (WesterOS) {
    var Shell = (function () {
        function Shell() {
            // Properties
            this.promptStr = ">";
            this.commandList = [];
            this.curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
            this.apologies = "[sorry]";
            this.locations = ["Winterfell", "Casterly Rock", "The Eyrie", "Sunspear", "Pyke", "Highgarden", "Storms End", "Dragonstone"];
            this.date = new Date();
            this.characters = ["Tyrion, of House Lannister", "Balon, of House Greyjoy", "Arya, of House Stark", "Daenarys, of House Targaryen", "Oberyn, of House Martell", "Stannis, of House Baratheon"];
            this.statuses = ["It's showtime", "I lied", "No problemo", "Stick around", "You're fired", "He had to split", "Let off some steam Bennet", "Consider that a divorce", "I'll be back", "Do it now", "You have been terminated", "Talk to the hand", "Get to the chopper", "Enough talk", "Hasta la vista, baby", "Put that cookie down", "I am Turboman"];
            this.commandHistory = new CommandHistory();
        }
        Shell.prototype.init = function () {
            var sc = null;

            //
            // Load the command list.
            // ver
            sc = new WesterOS.ShellCommand(this.shellVer, "ver", "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;

            // whereami
            sc = new WesterOS.ShellCommand(this.shellWhereAmI, "whereami", "- Gives a location from Westeros.");
            this.commandList[this.commandList.length] = sc;

            // date
            sc = new WesterOS.ShellCommand(this.shellDate, "date", "- Gives the date.");
            this.commandList[this.commandList.length] = sc;

            // whoami
            sc = new WesterOS.ShellCommand(this.shellWhoAmI, "whoami", "- Tells you your Westerosi identity.");
            this.commandList[this.commandList.length] = sc;

            // status
            sc = new WesterOS.ShellCommand(this.shellStatus, "status", "<string> - Update your status.");
            this.commandList[this.commandList.length] = sc;

            // ps
            sc = new WesterOS.ShellCommand(this.shellPS, "ps", " - Displays all active process PIDs.");
            this.commandList[this.commandList.length] = sc;

            // help
            sc = new WesterOS.ShellCommand(this.shellHelp, "help", "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;

            // shutdown
            sc = new WesterOS.ShellCommand(this.shellShutdown, "shutdown", "- Shuts down the virtual OS but leaves the underlying hardware simulation running.");
            this.commandList[this.commandList.length] = sc;

            // cls
            sc = new WesterOS.ShellCommand(this.shellCls, "cls", "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;

            // clearmem command
            sc = new WesterOS.ShellCommand(this.shellClearMem, "clearmem", "- Clears all memory partitions.");
            this.commandList[this.commandList.length] = sc;

            // man <topic>
            sc = new WesterOS.ShellCommand(this.shellMan, "man", "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;

            // trace <on | off>
            sc = new WesterOS.ShellCommand(this.shellTrace, "trace", "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;

            // rot13 <string>
            sc = new WesterOS.ShellCommand(this.shellRot13, "rot13", "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;

            // prompt <string>
            sc = new WesterOS.ShellCommand(this.shellPrompt, "prompt", "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;

            // load command
            sc = new WesterOS.ShellCommand(this.shellLoad, "load", "[priority] - Loads a user program");
            this.commandList[this.commandList.length] = sc;

            // run command
            sc = new WesterOS.ShellCommand(this.shellRun, "run", "<PID> - Runs a user program from memory");
            this.commandList[this.commandList.length] = sc;

            // runall command
            sc = new WesterOS.ShellCommand(this.shellRunAll, "runall", "- Runs all user programs loaded into memory");
            this.commandList[this.commandList.length] = sc;

            // quantum command
            sc = new WesterOS.ShellCommand(this.shellQuantum, "quantum", "<int> - Sets the quantum length");
            this.commandList[this.commandList.length] = sc;

            // bsod command
            sc = new WesterOS.ShellCommand(this.shellBSOD, "bsod", "- Enables the... 'blue' screen of death");
            this.commandList[this.commandList.length] = sc;

            // processes - list the running processes and their IDs
            // kill <id> - kills the specified process id.
            //
            // Display the initial prompt.
            this.putPrompt();
        };

        Shell.prototype.putPrompt = function () {
            _StdOut.putText(this.promptStr);
        };

        Shell.prototype.handleInput = function (buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);

            //
            // Parse the input...
            //
            var userCommand = new WesterOS.UserCommand();
            userCommand = this.parseInput(buffer);

            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;

            // Add input to the command history. Invalid commands are accepted as well
            this.commandHistory.add(userCommand);

            //
            // Determine the command and execute it.
            //
            // JavaScript may not support associative arrays in all browsers so we have to
            // iterate over the command list in attempt to find a match.  TODO: Is there a better way? Probably.
            var index = 0;
            var found = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + WesterOS.Utils.rot13(cmd) + "]") >= 0) {
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {
                    this.execute(this.shellApology);
                } else {
                    this.execute(this.shellInvalidCommand);
                }
            }
        };

        // args is an option parameter, ergo the ? which allows TypeScript to understand that
        Shell.prototype.execute = function (fn, args) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();

            // ... call the command function passing in the args...
            fn(args);

            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }

            // ... and finally write the prompt again.
            this.putPrompt();
        };

        Shell.prototype.parseInput = function (buffer) {
            var retVal = new WesterOS.UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = WesterOS.Utils.trim(buffer);

            // 2. Lower-case it.
            buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();

            // 4.1 Remove any left-over spaces.
            cmd = WesterOS.Utils.trim(cmd);

            // 4.2 Record it in the return value.
            retVal.command = cmd;

            for (var i in tempList) {
                var arg = WesterOS.Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        };

        // Handles traversing through the command history
        Shell.prototype.accessHistory = function (chr) {
            if (chr === "UP") {
                this.commandHistory.backward();
            } else {
                this.commandHistory.forward();
            }

            return this.commandHistory.getCommand();
        };

        //
        // Shell Command Functions.  Again, not part of Shell() class per se', just called from there.
        //
        Shell.prototype.shellInvalidCommand = function () {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Duh. Go back to your Speak & Spell.");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        };

        Shell.prototype.shellCurse = function () {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        };

        Shell.prototype.shellApology = function () {
            if (_SarcasticMode) {
                _StdOut.putText("Okay. I forgive you. This time.");
                _SarcasticMode = false;
            } else {
                _StdOut.putText("For what?");
            }
        };

        Shell.prototype.shellVer = function (args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
        };

        Shell.prototype.shellWhereAmI = function (args) {
            _StdOut.putText("You are in " + _OsShell.locations[Math.floor(Math.random() * _OsShell.locations.length)] + ", my lord.");
        };

        Shell.prototype.shellWhoAmI = function (args) {
            _StdOut.putText("You are " + _OsShell.characters[Math.floor(Math.random() * _OsShell.characters.length)] + ", my lord.");
        };

        Shell.prototype.shellDate = function (args) {
            _StdOut.putText("The current date is " + _OsShell.date.toDateString());
        };

        Shell.prototype.shellStatus = function (args) {
            if (args.length > 0) {
                var status = "STATUS: ";
                for (var i = 0; i < args.length; i++) {
                    status += args[i] + " ";
                }
                document.getElementById("statusBar").innerHTML = status;
            } else {
                document.getElementById("statusBar").innerHTML = "STATUS: " + _OsShell.statuses[Math.floor(Math.random() * _OsShell.statuses.length)];
            }
        };

        Shell.prototype.shellHelp = function (args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        };

        Shell.prototype.shellShutdown = function (args) {
            _StdOut.putText("Shutting down...");

            // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
        };

        Shell.prototype.shellCls = function (args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        };

        Shell.prototype.shellMan = function (args) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "help":
                        _StdOut.putText("Help displays a list of (hopefully) valid commands.");
                        break;
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            } else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        };

        Shell.prototype.shellTrace = function (args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, dumbass.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }

                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        };

        Shell.prototype.shellRot13 = function (args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + WesterOS.Utils.rot13(args.join(' ')) + "'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        };

        Shell.prototype.shellPrompt = function (args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        };

        Shell.prototype.shellLoad = function (args) {
            var input = document.getElementById("taProgramInput").value;
            input = input.replace(/\s+/g, ' ').toUpperCase();
            var priority = 10;

            // Check to see that there is a program
            if (input.length <= 0) {
                _StdOut.putText("ERROR: No program entered.");
                return;
            }

            for (var index = 0; index < input.length; index++) {
                if (!input[index].match(/^[0-9A-F\s]/i)) {
                    _StdOut.putText("ERROR: Program contains invalid character at location: " + (index + 1));
                    return;
                }
            }

            // Attempt to load the function into the Memory Manager
            var pid = _MemoryManager.loadProgram(input);
            if (pid !== null) {
                _StdOut.putText("PID: " + pid);
            } else {
            }
            _MemoryManager.displayMemory();
        };

        Shell.prototype.shellRun = function (args) {
            // Check to see if there is PID
            if (args.length <= 0) {
                _StdOut.putText("ERROR: Please specify a PID");
            } else if (!_ProcessList[args[0]]) {
                _StdOut.putText("ERROR: Invalid PID");
            } else {
                // Get requested program
                var requestedProgram = _ProcessList[args[0]];

                // Check programs state
                if (requestedProgram.state !== "TERMINATED") {
                    requestedProgram.state = "READY";
                    _ReadyQueue.enqueue(requestedProgram);
                    console.debug(_ReadyQueue.length());
                    _KernelInterruptQueue.enqueue(new WesterOS.Interrupt(PROCESS_EXECUTION_IRQ));
                } else {
                    _StdOut.putText("ERROR: Kernel is already handling that process");
                }
            }
        };

        Shell.prototype.shellRunAll = function (args) {
            for (var i = 0; i < _ProcessList.length; i++) {
                var requestedProgram = _ProcessList[i];
                if (requestedProgram.state !== "TERMINATED") {
                    _ReadyQueue.enqueue(requestedProgram);
                }
            }
            _KernelInterruptQueue.enqueue(new WesterOS.Interrupt(PROCESS_EXECUTION_IRQ));
        };

        Shell.prototype.shellQuantum = function (args) {
            if (args.length > 0) {
                _CpuScheduler.setQuantum(args[0]);
            } else {
                _StdOut.putText("ERROR: Please supply an integer value.");
            }
        };

        Shell.prototype.shellBSOD = function (args) {
            _Kernel.krnTrapError("Enabled bsod, for fun and games.");
        };

        Shell.prototype.shellClearMem = function (args) {
            _MemoryManager.clearAllMemory();
            _MemoryManager.displayMemory();
            _StdOut.putText("All memory locations cleared.");
        };

        Shell.prototype.shellPS = function (args) {
            console.debug("start");
            var result = "Active Process PIDs: ";
            var resultBool = false;

            for (var i = 0; i < _ReadyQueue.length(); i++) {
                console.debug(_ReadyQueue.length());
                if (_ReadyQueue.q[i].pcb.state !== "TERMINATED") {
                    resultBool = true;
                    result += _ReadyQueue.q[i].pcb.pid + " ";
                    console.debug("ready queue: " + _ReadyQueue.q[i].pcb.pid);
                }
            }

            if (_CurrentProcess !== null) {
                console.debug("current process: " + _CurrentProcess.pcb.pid);
                resultBool = true;
                result += _CurrentProcess.pcb.pid;
            }

            if (resultBool) {
                _StdOut.putText(result);
            } else {
                _StdOut.putText("There are no currrently running processes.");
            }
        };
        return Shell;
    })();
    WesterOS.Shell = Shell;

    // Class that handles the command history
    // Necessary for up and down arrows in the console
    var CommandHistory = (function () {
        function CommandHistory() {
            // Properties
            this.history = [];
            this.position = -1;
        }
        // Goes to previous command, if one exists
        CommandHistory.prototype.backward = function () {
            if (this.position < this.history.length - 1) {
                this.position = this.position + 1;
            }
        };

        // Goes to more recent command, if one exists
        CommandHistory.prototype.forward = function () {
            if (this.position > -1) {
                this.position = this.position - 1;
            }
        };

        // Adds a command to past history
        CommandHistory.prototype.add = function (userCommand) {
            var arguments = "";

            // If the new command has arguments...
            if (userCommand.args.length > 0) {
                arguments = " ";
                for (var i = 0; i < userCommand.args.length; i++) {
                    var spaces = (i === userCommand.args.length - 1) ? "" : " ";
                    arguments += userCommand.args[i] + spaces;
                }
            }

            // Attach arguments to new command. Add to list
            var newCommand = userCommand.command + arguments;
            this.history.unshift(newCommand);
            this.position = -1;
        };

        // Get the specified command, if available
        CommandHistory.prototype.getCommand = function () {
            return (this.position === -1) ? "" : this.history[this.position];
        };
        return CommandHistory;
    })();
    WesterOS.CommandHistory = CommandHistory;
})(WesterOS || (WesterOS = {}));
