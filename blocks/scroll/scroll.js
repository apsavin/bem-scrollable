/**@module Scroll*/
modules.define('scroll', ['i-bem__dom'], function (provide, BEMDOM) {

    /**
     * @class Scroll
     * @extends BEMDOM
     */
    provide(BEMDOM.decl('scroll', /**@lends Scroll#*/{

        /**
         * Name of method to get and set size of elements (usually 'width' or 'height')
         * @property
         * @protected
         * @type {String}
         */
        _sizeMethod: '',

        /**
         * Name of property to get or set shift of elements (usually 'top' or 'left')
         * @property
         * @protected
         * @type {String}
         */
        _shiftProp: '',

        /**
         * Name of property to get pageShift from event ('pageX' of 'pageY')
         * @property
         * @protected
         * @type {String}
         */
        _pageShiftProp: '',

        /**
         * @property
         * @private
         * @type {Boolean}
         */
        _disabled: false,

        /**
         * one-step shift when user clicks buttons of scroll
         * @property
         * @type {Number}
         * @protected
         */
        _buttonShift: 36,

        /**
         * @property
         * @type {Number}
         * @private
         */
        _minThumbSize: 8,

        /**
         * @property
         * @private
         * @type {Number}
         */
        _moveTrackTimeoutId: 0,

        onSetMod: {

            'js': {
                inited: function () {

                    if (!this.hasMod('type')) {
                        throw 'mod type is necessary';
                    }

                    var minThumbSize = parseInt(this.elem('thumb').css('min-' + this._sizeMethod), 10);
                    if (minThumbSize) {
                        this._minThumbSize = minThumbSize;
                    }
                    this.elem('thumb').disableSelection();
                    this.elem('track').disableSelection();
                    this._onThumbMove = this._onThumbMove.bind(this);
                    this._onThumbUp = this._onThumbUp.bind(this);
                }
            }

        },

        /**
         * @param {Number} viewportSize Scrollable viewport (small) size
         * @param {Number} contentSize Scrollable content (big) size
         */
        update: function (viewportSize, contentSize) {
            if (contentSize <= viewportSize) {
                //if scroll is disabled then we don't need to do anything
                this._disable();
                return;
            }
            this.setMod('active', true);
            this._maxScrollableShift = contentSize - viewportSize;
            var trackSize = this.elem('track')[this._sizeMethod](),
                thumbSize = this._thumbSize = Math.ceil(viewportSize * trackSize / contentSize);

            if (thumbSize < this._minThumbSize) {
                thumbSize = this._minThumbSize;
            }

            this._maxShift = trackSize - thumbSize;
            this.elem('thumb')[this._sizeMethod](thumbSize);
            //triggering of "enable" event must be after all calculations, when scroll is really enable and ready to go
            this._enable();
        },

        /**
         * @param {Number} scrollableShift usually scrollTop or scrollLeft of Scrollable area
         */
        setShift: function (scrollableShift) {
            var options = {};
            this._currentScrollableShift = scrollableShift;
            this._currentShift = options[this._shiftProp] = this._convertShiftFromScrollable(scrollableShift);
            this.elem('thumb').css(options);
        },

        /**
         * converts shift of scrollable area to shift of scroll
         * @param {Number} scrollableShift
         * @returns {Number}
         */
        _convertShiftFromScrollable: function (scrollableShift) {
            return Math.round(scrollableShift * this._maxShift / this._maxScrollableShift);
        },

        /**
         * converts shift of scroll to shift of scrollable area
         * @param {Number} shift
         * @returns {Number}
         */
        _convertShiftToScrollable: function (shift) {
            return Math.round(shift * this._maxScrollableShift / this._maxShift);
        },

        /**
         * triggers 'shift' event with {Number} shift as argument to callback
         * @param {Number} diff - difference between current state and desired state
         * @param {Boolean} [withoutConversion] if you don't need to convert shift of scroll to shift of scrollable
         * @protected
         */
        _shift: function (diff, withoutConversion) {
            if (!diff) {
                return;
            }
            var shift = withoutConversion ?
            diff + this._currentScrollableShift :
                this._convertShiftToScrollable(diff + this._currentShift);
            this._shiftTo(shift, true);
        },

        /**
         * triggers 'shift' event with {Number} shift as argument to callback
         * @param {Number} shift
         * @param {Boolean} [withoutConversion] if you don't need to convert shift of scroll to shift of scrollable
         * @private
         */
        _shiftTo: function (shift, withoutConversion) {
            shift = withoutConversion ? shift : this._convertShiftToScrollable(shift);
            if (shift < 0) {
                shift = 0;
            } else if (shift > this._maxScrollableShift) {
                shift = this._maxScrollableShift;
            }
            this.emit('shift', {shift: shift});
        },

        /**
         * @returns {Boolean}
         */
        isDisabled: function () {
            return this._disabled;
        },

        /**
         * @private
         */
        _disable: function () {
            if (this.isDisabled()) {
                return;
            }
            this._disabled = true;
            this.delMod('active');
            this.emit('disabled');
        },

        /**
         * @private
         */
        _enable: function () {
            if (!this.isDisabled()) {
                return;
            }
            this._disabled = false;
            this.setMod('active');
            this.emit('enabled');
        },

        /**
         * @param {jQuery.Event} e
         * @private
         */
        _onThumbPointerDown: function (e) {
            e.preventDefault();

            this._thumbStart = e[this._pageShiftProp];
            this._thumbStartShift = this._currentShift;
            this.setMod('dragging');

            this.__self.doc
                .on('pointerup.scroll', this._onThumbUp)
                .on('pointermove.scroll', this._onThumbMove);
        },

        /**
         * @param {jQuery.Event} e
         * @method
         * @private
         */
        _onThumbMove: function (e) {
            var shift = e[this._pageShiftProp];

            this._shiftTo(this._thumbStartShift + shift - this._thumbStart);
        },

        /**
         * @private
         * @method
         */
        _onThumbUp: function () {
            this.delMod('dragging');
            this.__self.doc.off('.scroll');
        },

        /**
         * @param {jQuery.Event} e
         * @private
         */
        _onTrackMouseDown: function (e) {
            if (e.target === this.elem('track')[0]) {
                this._moveTrack(e);
                this.__self.doc.on('mouseup.scroll', this._onTrackUp.bind(this));
            }
        },

        /**
         * @param {Event} e
         * @private
         */
        _moveTrack: function (e) {
            var mousePosition = this._getMouseRelThumbPosition(e),
                shift = mousePosition * this._thumbSize;
            if (shift) {
                this._shift(shift);
                this._moveTrackTimeoutId = setTimeout(this._moveTrack.bind(this, e), 0);
            }
        },

        /**
         * @private
         */
        _onTrackUp: function () {
            this.__self.doc.off('mouseup.scroll');
            if (this._moveTrackTimeoutId) {
                clearTimeout(this._moveTrackTimeoutId);
            }
        },

        /**
         * returns mouse position relative to thumb position
         * @param {Event} e
         * @returns {Number} 1 | 0 | -1
         * @private
         */
        _getMouseRelThumbPosition: function (e) {
            var mousePosition = e[this._pageShiftProp],
                start = this.elem('thumb').offset()[this._shiftProp],
                before = mousePosition < start,
                end = start + this._thumbSize,
                after = mousePosition > end;
            return before ? -1 : after ? 1 : 0;
        }

    }, {

        live: function () {

            this
                .liveBindTo('thumb', 'pointerdown', function (e) {
                    this._onThumbPointerDown(e);
                })
                .liveBindTo('track', 'mousedown', function (e) {
                    this._onTrackMouseDown(e);
                });
        }

    }));
});
