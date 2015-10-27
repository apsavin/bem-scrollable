modules.define('scroll', function (provide, Scroll) {

    /**
     * @class ScrollTypeHorizontal
     */
    provide(Scroll.decl({modName: 'type', modVal: 'horizontal' }, {

        onSetMod: {

            'js': {
                inited: function () {
                    this._sizeMethod = 'width';
                    this._shiftProp = 'left';
                    this._pageShiftProp = 'pageX';
                    this.__base();
                }
            }

        }

    }));
});
