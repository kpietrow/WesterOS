var WesterOS;
(function (WesterOS) {
    var ShellCommand = (function () {
        function ShellCommand(func, command, description) {
            if (typeof command === "undefined") { command = ""; }
            if (typeof description === "undefined") { description = ""; }
            this.func = func;
            this.command = command;
            this.description = description;
        }
        return ShellCommand;
    })();
    WesterOS.ShellCommand = ShellCommand;
})(WesterOS || (WesterOS = {}));
//# sourceMappingURL=shellCommand.js.map
