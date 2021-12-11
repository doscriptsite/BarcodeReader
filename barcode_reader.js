(function ($) {
    "use strict";

    /**
     * 监听条形码扫码枪输入
     * @param {jQuery.fn} el 要监听的jQuery节点对象
     * @param {*} options 配置选项
     */
    var BarcodeReader = function (el, options) {
        this.listenerObj = el;
        this.options = Object.assign({
            debug: false, // 输出调试log
            code_len: 8, // 允许的条形码长度，可以是整型，也可以是整型数组[12, 14, 15, 17]
            allow_letter: false, // 是否允许字母
            allow_number: true, // 是否允许数字
            allow_other_char_map: { // 其他允许的键值和键名文本映射表
                189: '-', 109: '-'
            },
            allow_press_interval: 200, // 允许的输入最大时间间隔(毫秒)
            allow_down_up_interval: 150, // 允许按下的最大时间(毫秒)
            end_for_tab: false, // 以Tab键结束
            end_for_enter: true, // 以Enter键结束
            letter_to_lower_case: false, // 把字母转为小写
            force_keep_focus: false, // 强制保持焦点；为true时会强制夺取其他元素的焦点，会导致输入框、下拉框、弹出框等控件失效；此参数可以传入function，判断是否为输入控件，返回false跳过焦点重置
            focus_check_interval: 1000, // 焦点检查的时间间隔(毫秒)
            alert_callback: function (msg) { // 提示信息回调
                alert(msg);
            },
            focus_change_callback: function (has_focus) { // 焦点变更通知回调
            },
            show: function (code) { // 扫码结果回调
            }
        }, options);

        this.debug = this.options.debug;
        this.code_len = this.options.code_len;
        this.allow_letter = this.options.allow_letter;
        this.allow_number = this.options.allow_number;
        this.allow_press_interval = this.options.allow_press_interval;
        this.allow_down_up_interval = this.options.allow_down_up_interval;
        this.end_for_tab = this.options.end_for_tab;
        this.end_for_enter = this.options.end_for_enter;
        this.allow_other_char_map = this.options.allow_other_char_map;
        this.letter_to_lower_case = this.options.letter_to_lower_case;
        this.force_keep_focus = this.options.force_keep_focus;
        this.focus_check_interval = this.options.focus_check_interval;
        this.alert_callback = this.options.alert_callback;
        this.focus_change_callback = this.options.focus_change_callback;
        this.callback = this.options.show;
        this._init();
    };
    BarcodeReader.prototype = {
        constructor: BarcodeReader,
        // 下面是配置项
        debug: false,
        code_len: 8,
        allow_letter: false,
        allow_number: true,
        allow_other_char_map: {},
        allow_press_interval: 200,
        allow_down_up_interval: 150,
        end_for_tab: false,
        end_for_enter: true,
        letter_to_lower_case: false,
        force_keep_focus: false,
        focus_check_interval: 1000,
        alert_callback: null,
        focus_change_callback: null,

        listenerObj: null,
        callback: null,
        down_keys: [],
        up_keys: [],
        last_press_time: new Date().getTime(),

        show: function (data) {
            return typeof this.callback === 'function' && this.callback.apply(this, [data]);
        },
        focus_change: function (has_focus) {
            return typeof this.focus_change_callback === 'function' && this.focus_change_callback.apply(this, [has_focus]);
        },
        on_key_down: function () {
            var self = this;
            this.listenerObj.keydown(function (e) {
                self.debug_log('down', e);
                var allow_down = false;
                if(e.shiftKey === true || e.altKey === true || e.ctrlKey === true){
                    self.log('Shift, Alt, Ctrl功能键被按下，忽略此次输入');
                    allow_down = true;
                }else{
                    var press_time = new Date().getTime();
                    self.debug_log(press_time, self.last_press_time, press_time - self.last_press_time);
                    if((self.down_keys.length > 0 || self.up_keys.length > 0) && press_time - self.last_press_time > self.allow_press_interval){
                        self.down_keys = [];
                        self.up_keys = [];
                        self.log('超过允许的输入最大间隔，输入中断');
                    }
                    self.last_press_time = press_time;
                    var keycode = e.keyCode;
                    var temp_time = e.timeStamp;
                    if(!temp_time || temp_time === 0){
                        temp_time = press_time;
                    }
                    self.down_keys.push({'key': e.key, 'keycode': keycode, 'time': temp_time});
                }
                if(!allow_down){
                    e.preventDefault();
                    e.returnValue = false;
                    return false;
                }else{
                    return true;
                }
            });
        },
        on_key_up: function () {
            var self = this;
            this.listenerObj.keyup(function (e) {
                self.debug_log('up', e);
                if(e.shiftKey === true || e.altKey === true || e.ctrlKey === true){
                    self.log('Shift, Alt, Ctrl功能键被按下，忽略此次输入');
                    return false;
                }
                var keycode = e.keyCode;
                var temp_time = e.timeStamp;
                if(!temp_time || temp_time === 0){
                    temp_time = new Date().getTime();
                }
                self.up_keys.push({'key': e.key, 'keycode': keycode, 'time': temp_time});
                if((keycode === 13 || keycode === 108) && self.end_for_enter){
                    self.log('Enter键结束');
                    self.buildBarcode();
                    return false;
                }else if(keycode === 9 && self.end_for_tab){
                    self.log('Tab键结束');
                    self.buildBarcode();
                    return false;
                }
            });
        },
        on_key_press: function () {
            var self = this;
            this.listenerObj.keypress(function (e) {
                self.debug_log('press', e);
                e.preventDefault();
                e.returnValue = false;
                return false;
            });
        },
        toCharCode: function (key) {
            if(this.allow_number && this.is_number(key)){
                return String.fromCharCode(key);
            }
            if(this.allow_letter && this.is_letter(key)){
                return String.fromCharCode(key);
            }
            if(this.allow_other_char_map.hasOwnProperty(key)){
                return this.allow_other_char_map[key];
            }
            return '';
        },
        in_range: function (key) {
            if(this.allow_number && this.is_number(key)){
                return true;
            }
            if(this.allow_letter && this.is_letter(key)){
                return true;
            }
            return this.allow_other_char_map.hasOwnProperty(key);
        },
        is_number: function (key) {
            return key <= 57 && key >= 48; // 57 - 9    48 - 0
        },
        is_letter: function (key) {
            return key <= 90 && key >= 65; // 65 - A    90 - Z
        },
        alert: function (msg) {
            typeof this.alert_callback === 'function' && this.alert_callback.apply(this, [msg]);
        },
        log: function (msg) {
            if(arguments.length > 1){
                console.log.apply(this, arguments);
            }else{
                console.log(msg);
            }
        },
        debug_log: function (msg) {
            if(this.debug){
                if(arguments.length > 1){
                    console.log.apply(this, arguments);
                }else{
                    console.log(msg);
                }
            }
        },
        buildBarcode: function () {
            var self = this;
            self.log('开始拼接结果');
            self.debug_log(self.down_keys, self.down_keys.length, self.up_keys, self.up_keys.length);
            if(self.down_keys.length === 0){
                self.log('拼接结束：按键记录为空');
                return false;
            }
            if(self.down_keys.length !== self.up_keys.length){
                self.debug_log(self.down_keys.length, self.up_keys.length);
                self.alert('检测到有干扰按键，输入无效');
                self.log('拼接结束：按下与弹起记录不一致');
                return false;
            }
            var barcode = '';
            var invalid = false;
            while(self.down_keys.length - 1 > 0){
                self.debug_log(self.down_keys);
                var down_key_obj = self.down_keys.shift();
                var up_key_obj = self.up_keys.shift();
                if(down_key_obj.keycode === up_key_obj.keycode){
                    if(up_key_obj.time - down_key_obj.time <= self.allow_down_up_interval){
                        if(self.in_range(down_key_obj.keycode)){
                            barcode += self.toCharCode(down_key_obj.keycode);
                        }else{
                            self.alert('检测到不允许的字符，此次输入丢弃');
                            self.log('检测到不允许的字符，此次输入丢弃');
                            invalid = true;
                        }
                    }else{
                        self.alert('检测到输入延迟过高，非扫码枪输入');
                        self.log('超过允许按下的最大时间，此次输入丢弃');
                        invalid = true;
                    }
                }else{
                    self.alert('检测到有多个按键同时输入，非扫码枪输入');
                    self.log('按下与弹出堆栈内容不一致，此次输入丢弃');
                    invalid = true;
                }
            }
            self.down_keys = [];
            self.up_keys = [];
            if(barcode.length > 0){
                self.log('拼接结果：' + barcode);
                if(!invalid){
                    if((typeof self.code_len === 'number' && barcode.length === self.code_len) || (typeof self.code_len === 'object' && self.code_len.indexOf(barcode.length) !== -1)){
                        if(self.letter_to_lower_case){
                            barcode = barcode.toLowerCase();
                        }else{
                            barcode = barcode.toUpperCase();
                        }
                        self.log('成功输出结果：' + barcode);
                        self.show(barcode);
                        return true;
                    }else{
                        self.alert('扫描的条形码长度不符');
                        self.log('条形码结果长度不符');
                    }
                }
            }
            self.log('拼接结束');
            return false;
        },
        _init: function () {
            this.on_key_down();
            this.on_key_up();
            //this.on_key_press();
            this.focusChecker();
            this.listenerObj.focus().select();
        },
        focusChecker: function () {
            var self = this;
            self.last_focus = true;
            setInterval(function () {
                var last_focus;
                var activeElement = window.document.activeElement;
                var j_activeElement = $(activeElement);
                if(!j_activeElement.is(self.listenerObj)){
                    self.log('失去输入焦点：', activeElement);
                    var force_keep_focus = false;
                    if(self.force_keep_focus === true){
                        force_keep_focus = true;
                    }else if(typeof self.force_keep_focus === 'function'){
                        force_keep_focus = self.force_keep_focus.apply(self, [j_activeElement, self.listenerObj]);
                    }
                    if(force_keep_focus === true){
                        j_activeElement.blur();
                        self.listenerObj.focus().select();
                    }
                    last_focus = false;
                }else{
                    last_focus = true;
                }
                if(last_focus !== self.last_focus){
                    self.last_focus = last_focus;
                    self.focus_change(last_focus);
                }
            }, this.focus_check_interval);
        }
    };
    $.fn.BarcodeReader = function (options) {
        if(!this.hasOwnProperty('BarcodeReader_obj')){
            this.BarcodeReader_obj = new BarcodeReader(this, options); // TODO 不支持重写配置项
        }
        return this.BarcodeReader_obj;
    };
})(jQuery);