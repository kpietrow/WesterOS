var WesterOS;
(function (WesterOS) {
    var UserCommand = (function () {
        function UserCommand(command, args) {
            if (typeof command === "undefined") { command = ""; }
            if (typeof args === "undefined") { args = []; }
            this.command = command;
            this.args = args;
        }
        return UserCommand;
    })();
    WesterOS.UserCommand = UserCommand;
})(WesterOS || (WesterOS = {}));
//# sourceMappingURL=userCommand.js.map
