modules.define(['jquery'], function (provide, $) {

    $.support.selectstart = "onselectstart" in document.createElement("div");
    $.fn.extend({
        disableSelection: function () {
            return this.bind(( $.support.selectstart ? "selectstart" : "mousedown" ) +
            ".ui-disableSelection", function (event) {
                event.preventDefault();
            });
        },

        enableSelection: function () {
            return this.unbind(".ui-disableSelection");
        }
    });

    return provide($);

});
