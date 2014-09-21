/* ------------
   time-display.ts

   Handles updating the date and time display

   By: Kevin Pietrow
   ------------ */

module Viper {
    export class dateTimeDisplay
    {
        constructor() {

        }

        public init() {
            this.updateDateTime();
        }

        public updateDateTime() {
            var dateTime= new Date();
            var dateString = dateTime.toDateString();
            dateString += dateTime.getTime();
            document.getElementById("dateTime").innerHTML = "POOP";
            setTimeout(this.updateDateTime, 1000);
        }
    }
}