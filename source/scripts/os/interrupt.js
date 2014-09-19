/* ------------
Interrupt.ts
------------ */
var Viper;
(function (Viper) {
    var Interrupt = (function () {
        function Interrupt(irq, params) {
            this.irq = irq;
            this.params = params;
        }
        return Interrupt;
    })();
    Viper.Interrupt = Interrupt;
})(Viper || (Viper = {}));
//# sourceMappingURL=interrupt.js.map
