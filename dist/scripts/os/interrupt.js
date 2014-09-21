/* ------------
Interrupt.ts
------------ */
var WesterOS;
(function (WesterOS) {
    var Interrupt = (function () {
        function Interrupt(irq, params) {
            this.irq = irq;
            this.params = params;
        }
        return Interrupt;
    })();
    WesterOS.Interrupt = Interrupt;
})(WesterOS || (WesterOS = {}));
