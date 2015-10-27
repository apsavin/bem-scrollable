modules.define('scroll', function (provide, Scroll) {

    /**
     * @class ScrollTypeVertical
     */
    provide(Scroll.decl({modName: 'type', modVal: 'vertical' }, {

        onSetMod: {

            'js': {
                inited: function () {
                    this._sizeMethod = 'height';
                    this._shiftProp = 'top';
                    this._pageShiftProp = 'pageY';
                    this.__base();
                }
            }

        }

    }));
});
