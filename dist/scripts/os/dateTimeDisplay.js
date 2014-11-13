/* ------------
time-display.ts
Handles updating the date and time display
By: Kevin Pietrow
------------ */
var WesterOS;
(function (WesterOS) {
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
            document.getElementById("dateTime").innerHTML = "test";
            setTimeout(this.updateDateTime, 1000);
        };
        return dateTimeDisplay;
    })();
    WesterOS.dateTimeDisplay = dateTimeDisplay;
})(WesterOS || (WesterOS = {}));
