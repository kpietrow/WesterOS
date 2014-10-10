/**
* The class of the host memory
*/
var WesterOS;
(function (WesterOS) {
    var Memory = (function () {
        function Memory(bytes) {
            this.data = new Array();
            this.bytes = bytes;
            this.init();
        }
        Memory.prototype.init = function () {
            for (var i = 0; i < this.bytes; i++) {
                this.data[i] = "00";
            }
        };
        return Memory;
    })();
    WesterOS.Memory = Memory;
})(WesterOS || (WesterOS = {}));
