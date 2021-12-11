# BarcodeReader

JavaScript监听条形码扫码枪输入，依赖jQuery

## 配置选项

| 配置名                  | 类型              | 说明                                                                                                                                                      |
| ---------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| debug                  | Boolean           | 输出调试log                                                                                                                                               |
| code_len               | Integer, Array    | 允许的条形码长度，可以是整型，也可以是整型数组[12, 14, 15, 17]                                                                                            |
| allow_letter           | Boolean           | 是否允许字母                                                                                                                                              |
| allow_number           | Boolean           | 是否允许数字                                                                                                                                              |
| allow_other_char_map   | Map               | 其他允许的键值和键名文本映射表                                                                                                                            |
| allow_press_interval   | Integer           | 允许输入的最大时间间隔(毫秒)                                                                                                                              |
| allow_down_up_interval | Integer           | 允许按下的最大时间间隔(毫秒)                                                                                                                                  |
| end_for_tab            | Boolean           | 以Tab键结束                                                                                                                                               |
| end_for_enter          | Boolean           | 以Enter键结束                                                                                                                                             |
| letter_to_lower_case   | Boolean           | 把字母转为小写，否则为大写                                                                                                                                            |
| force_keep_focus       | Boolean, Function | 强制保持焦点；为true时会强制夺取其他元素的焦点，会导致输入框、下拉框、弹出框等控件失效；此参数可以传入function，判断是否为输入控件，返回false跳过焦点重置 |
| focus_check_interval   | Integer           | 焦点检查的时间间隔(毫秒)                                                                                                                                  |
| alert_callback         | Function          | 提示信息回调                                                                                                                                              |
| focus_change_callback  | Function          | 焦点变更通知回调                                                                                                                                          |
| show                   | Function          | 扫码结果回调                                                                                                                                              |

使用方法见 [demo.html](https://github.com/doscriptsite/BarcodeReader/blob/master/demo.html)