import * as _ from 'lodash';

export const Fn = {
    assign: _.assign,
    extend: _.extend,
    debounce: _.debounce,
    square: (x: number): number => x * x,
    sleep(ms: number) {
        const start = Date.now();
        while (Date.now() < start + ms) {}
    },
    uid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, chr => {
                const rnd = Math.random() * 16 | 0;
                return (chr === 'x' ? rnd : (rnd & 0x3 | 0x8)).toString(16);
            })
            .toUpperCase();
    },
    scale(x: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number): number {
        return ( x - fromLow ) * ( toHigh - toLow ) / ( fromHigh - fromLow ) + toLow;
    },
    constrain(x: number, lower: number, upper: number): number {
        return x <= upper && x >= lower
            ? x
            : (x > upper ? upper : lower);
    },
    range(lower: number, upper: number, tick: number): number[] {
        if (arguments.length === 1) {
            upper = lower;
            lower = 0;
        }

        lower = lower || 0;
        upper = upper || 0;
        tick = tick || 1;

        const len = Math.max( Math.ceil( (upper - lower) / tick ), 0 );
        const range = [];
        let idx = 0;

        while ( idx <= len ) {
            range[ idx++ ] = lower;
            lower += tick;
        }

        return range;
    }
    // prefixed(prefix: number, ...nums: number[]): string[] {
    //   return Fn.range(...nums).map(val => prefix + val);
    // }
};
