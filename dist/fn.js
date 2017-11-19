"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
exports.Fn = {
    assign: _.assign,
    extend: _.extend,
    debounce: _.debounce,
    square: function (x) { return x * x; },
    sleep: function (ms) {
        var start = Date.now();
        while (Date.now() < start + ms) { }
    },
    uid: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, function (chr) {
            var rnd = Math.random() * 16 | 0;
            return (chr === 'x' ? rnd : (rnd & 0x3 | 0x8)).toString(16);
        })
            .toUpperCase();
    },
    scale: function (x, fromLow, fromHigh, toLow, toHigh) {
        return (x - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
    },
    constrain: function (x, lower, upper) {
        return x <= upper && x >= lower
            ? x
            : (x > upper ? upper : lower);
    },
    range: function (lower, upper, tick) {
        if (arguments.length === 1) {
            upper = lower;
            lower = 0;
        }
        lower = lower || 0;
        upper = upper || 0;
        tick = tick || 1;
        var len = Math.max(Math.ceil((upper - lower) / tick), 0);
        var range = [];
        var idx = 0;
        while (idx <= len) {
            range[idx++] = lower;
            lower += tick;
        }
        return range;
    }
    // prefixed(prefix: number, ...nums: number[]): string[] {
    //   return Fn.range(...nums).map(val => prefix + val);
    // }
};
