var Viper;
(function (Viper) {
    var UserCommand = (function () {
        function UserCommand(command, args) {
            if (typeof command === "undefined") { command = ""; }
            if (typeof args === "undefined") { args = []; }
            this.command = command;
            this.args = args;
        }
        return UserCommand;
    })();
    Viper.UserCommand = UserCommand;
})(Viper || (Viper = {}));
