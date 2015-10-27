modules.define('scrollable', [
    'events__channels', 'functions__debounce', 'i-bem__dom', 'visibility-listener', 'jquery'
], function (provide, channels, debounce, BEMDOM, VisibilityListener, $) {

    /**
     * @class Scrollable
     * @mixes VisibilityListener
     */
    var Scrollable = BEMDOM.decl(this.name, VisibilityListener).decl(/**@lends Scrollable*/{

        onSetMod: {
            js: {
                inited: function () {
                    this.__base();
                    /**
                     * @type {Boolean}
                     * @private
                     */
                    this._verticalScrollDisabled = true;

                    /**
                     * @type {boolean}
                     * @private
                     */
                    this._isScrollsAutoHiding = !this.hasMod('hiding');

                    /**
                     * @type {ScrollTypeVertical|null}
                     * @protected
                     */
                    this._verticalScroll = null;

                    /**
                     * @function
                     * @private
                     */
                    this._allowContentSelection = debounce(this._allowContentSelection, 500);

                    if (this.isVisible()) {
                        this._fixDimensions();
                        this.setMod('inited', true);
                    }

                    this._initVerticalScroll();

                    this.__self.win.resize(this._onWinResize.bind(this));
                }
            }
        },

        /**
         * @private
         */
        _onWinResize: function () {
            this.update();
        },

        /**
         * @param {String|jQuery|Element} content
         * @returns {Scrollable}
         */
        setContent: function (content) {
            this.elem('content').html(content);
            this.update();
            return this;
        },

        /**
         * @returns {boolean}
         */
        hasContent: function () {
            return this.elem('content').children().length > 0;
        },

        /**
         * updates scroll of scrollable
         * @returns {Scrollable}
         */
        _update: function () {
            this._updateWidthAndHeight();
            if (this._verticalScroll) {
                this._updateVerticalScroll();
            }
            return this;
        },

        /**
         * Выставляем свойство
         * для корректного расчета высоты контента:
         * bottom: auto заставит контент растянуться
         * на всю возможную высоту
         * @protected
         */
        _setContentBottomToAuto: function () {
            this.elem('content').css('bottom', 'auto');
        },

        /**
         * Убираем заданное свойство
         * его значение теперь будет браться из css
         * и зависеть от проставленных классов
         * @protected
         */
        _setContentBottomToPredefinedValue: function () {
            this.elem('content').css('bottom', '');
        },

        /**
         * @protected
         */
        _updateWidthAndHeight: function () {
            this.delMod('inited');
            this.domElem
                .width('')
                .height('');
            if (this._verticalScroll) {
                this._fixDimensions();
                this.domElem.width('');
                this.setMod('inited', true);
                this._enableVerticalScroll();
                this._updateVerticalScroll();
                this.delMod('inited');
            }
            this._fixDimensions();
            this.setMod('inited', true);
        },

        /**
         * @private
         */
        _fixDimensions: function () {
            var width, height;
            //В IE9, IE10 ширина и высота элемента могут быть дробными
            //Получить их точные значения удается только через getComputedStyle
            //outerWidth и outerHeight возвращают округленные значения, что приводит к багам
            if ($.browser.msie && window.getComputedStyle) {
                var computedStyle = getComputedStyle(this.domElem[0]);
                width = this._calculatePropertiesSum(['width', 'borderLeftWidth', 'borderRightWidth'], computedStyle);
                height = this._calculatePropertiesSum(['height', 'borderTopWidth', 'borderBottomWidth'], computedStyle);
            } else {
                width = this.domElem.outerWidth();
                height = this.domElem.outerHeight();
            }
            this.domElem.width(width)
                .height(height);
        },

        /**
         * @param {Array} props
         * @param {Object} object
         * @returns {number}
         * @private
         */
        _calculatePropertiesSum: function (props, object) {
            return Math.ceil(props.reduce(function (memo, prop) {
                return memo + parseFloat(object[prop]);
            }, 0));
        },

        /**
         * @param {jQuery} $el
         * @param {number} [offset] additional space from target to top or bottom of scrollable area
         * @returns {Scrollable} this
         */
        scrollTo: function ($el, offset) {
            offset = offset || 0;

            var elTop = $el.offset().top,
                elHeight = $el.outerHeight(),
                elBottom = elTop + elHeight;

            var $viewport = this.elem('viewport'),
                viewportTop = $viewport.offset().top,
                viewportHeight = $viewport.height(),
                viewportBottom = viewportTop + viewportHeight;

            // element inside scrollable viewport
            if (elTop > viewportTop + offset && elBottom < viewportBottom - offset) {
                return this;
            }

            var options = {
                offset: -offset,
                /**
                 * Синхронизация кастомного скролла с системным происходит на событие scroll,
                 * а оно может зажечься (не в мозиле) в момент, когда элемент уже невидим (и scrollTop будет неверный).
                 * При этом если после этого установить тот же самый скрол (например в Хроме) то оно не будет зажигаться.
                 */
                onAfter: this._setVerticalScrollShift.bind(this)
            };
            if (elBottom >= viewportBottom - offset) {
                options.offset = elHeight + offset - viewportHeight;
            }

            this.elem('systemscrolls').scrollTo($el, options);
            return this;
        },

        /**
         * @returns {Number}
         * @protected
         */
        _getViewportHeight: function () {
            return this.elem('viewport').innerHeight();
        },

        /**
         * @returns {Number}
         * @protected
         */
        _getContentHeight: function () {
            return this.elem('content').outerHeight();
        },

        /**
         * @protected
         */
        _initVerticalScroll: function () {
            this._verticalScroll = this.findBlockInside({
                block: 'scroll',
                type: 'vertical'
            });
            if (!this._verticalScroll) {
                return;
            }

            this._verticalScroll
                .on('disabled', this._onVerticalScrollDisabled, this)
                .on('enabled', this._onVerticalScrollEnabled, this)
                .on('shift', this._onVerticalScrollShift, this);

            if (this.isVisible()) {
                this._enableVerticalScroll();
                this._updateVerticalScroll();
            }

            this.elem('systemscrolls').on('scroll', this._onScrollY.bind(this));
        },

        /**
         * @private
         */
        _updateVerticalScroll: function () {
            if (this._isScrollsAutoHiding) {
                this._setContentBottomToAuto();
            }

            var contentSize = this._getContentHeight(),
                viewportSize = this._getViewportHeight();

            if (this._isScrollsAutoHiding) {
                this._setContentBottomToPredefinedValue();
            }

            this._verticalScroll.update(viewportSize, contentSize);
            this._verticalScroll.setShift(this.elem('systemscrolls').scrollTop());

            if (this._verticalScroll.isDisabled()) {
                this._onVerticalScrollDisabled();
            } else {
                this._onVerticalScrollEnabled();
            }
        },
        /**
         * @protected
         */
        _onVerticalScrollDisabled: function () {
            if (this._isScrollsAutoHiding) {
                this.delMod('vertical');
                if (Scrollable.sizes.verticalOptimized) {
                    this.elem('systemscrolls').css({
                        right: 0
                    });
                }
            }
            this._verticalScrollDisabled = true;
        },

        /**
         * @private
         */
        _onVerticalScrollEnabled: function () {
            if (this._isScrollsAutoHiding && this._verticalScrollDisabled) {
                this._enableVerticalScroll();
            }
        },

        /**
         * @private
         */
        _enableVerticalScroll: function () {
            this.setMod('vertical', 'active');
            if (Scrollable.sizes.verticalOptimized) {
                this.elem('systemscrolls').css({
                    right: -Scrollable.sizes.verticalOptimized + 'px'
                });
            }
            this._verticalScrollDisabled = false;
        },

        /**
         * @returns {Boolean}
         * @protected
         */
        _isVerticalScrollDisabled: function () {
            return this._verticalScrollDisabled;
        },

        /**
         * @returns {Boolean}
         * @protected
         */
        _isVerticalScrollEnabled: function () {
            return !this._verticalScrollDisabled;
        },

        /**
         * @param {Event} e
         * @param {{shift: number}} data
         * @private
         */
        _onVerticalScrollShift: function (e, data) {
            this._preventContentSelection();
            this.elem('systemscrolls').scrollTop(data.shift);
            this._allowContentSelection();
        },

        /**
         * @private
         */
        _onScrollY: function () {
            this._setVerticalScrollShift();
        },

        /**
         * @private
         */
        _setVerticalScrollShift: function () {
            this._verticalScroll.setShift(this.elem('systemscrolls').scrollTop());
        },

        /**
         * @private
         */
        _preventContentSelection: function () {
            this.setMod(this.elem('content'), 'scrolling', true);
        },

        /**
         * @private
         * @method
         */
        _allowContentSelection: function () {
            this.delMod(this.elem('content'), 'scrolling');
        }

    }, /**@static Scrollable*/{

        live: false,

        /**
         * size of scroll
         * @type {Number}
         * @static
         */
        sizes: (function () {
            var $tempElementWithScrolls = $('<div></div>').addClass('scrollable__size-helper').appendTo('body'),
                $tempElementWithOptimizedScrolls = $('<div></div>').addClass('scrollable__size-helper').addClass('scrollable__size-helper_scoll_switched-off').appendTo('body'),
                tempElementWithOptimizedScrolls = $tempElementWithOptimizedScrolls[0],
                tempElementWithScrolls = $tempElementWithScrolls[0],
                sizes = {
                    vertical: tempElementWithScrolls.offsetWidth - tempElementWithScrolls.clientWidth,
                    horizontal: tempElementWithScrolls.offsetHeight - tempElementWithScrolls.clientHeight,
                    verticalOptimized: tempElementWithOptimizedScrolls.offsetWidth - tempElementWithOptimizedScrolls.clientWidth,
                    horizontalOptimized: tempElementWithOptimizedScrolls.offsetHeight - tempElementWithOptimizedScrolls.clientHeight
                };
            $tempElementWithOptimizedScrolls.remove();
            $tempElementWithScrolls.remove();
            return sizes;
        })()

    });

    provide(Scrollable);
});
