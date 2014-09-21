/* ------------
time-display.ts
Handles updating the date and time display
By: Kevin Pietrow
------------ */
var Viper;
(function (Viper) {
    var dateTimeDisplay = (function () {
        function dateTimeDisplay() {
        }
        dateTimeDisplay.prototype.init = function () {
            this.updateDateTime();
        };

        dateTimeDisplay.prototype.updateDateTime = function () {
            var dateTime = new Date();
            var dateString = dateTime.toDateString();
            dateString += dateTime.getTime();
            document.getElementById("dateTime").innerHTML = "POOP";
            setTimeout(this.updateDateTime, 1000);
        };
        return dateTimeDisplay;
    })();
    Viper.dateTimeDisplay = dateTimeDisplay;
})(Viper || (Viper = {}));
