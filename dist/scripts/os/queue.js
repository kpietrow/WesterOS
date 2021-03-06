/* ------------
Queue.ts
A simple Queue, which is really just a dressed-up JavaScript Array.
See the Javascript Array documentation at
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
Look at the push and shift methods, as they are the least obvious here.
------------ */
var WesterOS;
(function (WesterOS) {
    var Queue = (function () {
        function Queue(q) {
            if (typeof q === "undefined") { q = new Array(); }
            this.q = q;
        }
        Queue.prototype.getSize = function () {
            return this.q.length;
        };

        Queue.prototype.length = function () {
            return this.q.length;
        };

        Queue.prototype.isEmpty = function () {
            return (this.q.length == 0);
        };

        Queue.prototype.enqueue = function (element) {
            this.q.push(element);
        };

        Queue.prototype.dequeue = function () {
            var retVal = null;
            if (this.q.length > 0) {
                retVal = this.q.shift();
            }
            return retVal;
        };

        Queue.prototype.toString = function () {
            var retVal = "";
            for (var i in this.q) {
                retVal += "[" + this.q[i].irq + "] ";
            }
            return retVal;
        };
        return Queue;
    })();
    WesterOS.Queue = Queue;
})(WesterOS || (WesterOS = {}));
