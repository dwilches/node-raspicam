/// <reference types="lodash" />
import * as _ from 'lodash';
export declare const Fn: {
    assign: {
        <TObject, TSource>(object: TObject, source: TSource): TObject & TSource;
        <TObject, TSource1, TSource2>(object: TObject, source1: TSource1, source2: TSource2): TObject & TSource1 & TSource2;
        <TObject, TSource1, TSource2, TSource3>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3): TObject & TSource1 & TSource2 & TSource3;
        <TObject, TSource1, TSource2, TSource3, TSource4>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3, source4: TSource4): TObject & TSource1 & TSource2 & TSource3 & TSource4;
        <TObject>(object: TObject): TObject;
        <TResult>(object: any, ...otherArgs: any[]): TResult;
    };
    extend: {
        <TObject, TSource>(object: TObject, source: TSource): TObject & TSource;
        <TObject, TSource1, TSource2>(object: TObject, source1: TSource1, source2: TSource2): TObject & TSource1 & TSource2;
        <TObject, TSource1, TSource2, TSource3>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3): TObject & TSource1 & TSource2 & TSource3;
        <TObject, TSource1, TSource2, TSource3, TSource4>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3, source4: TSource4): TObject & TSource1 & TSource2 & TSource3 & TSource4;
        <TObject>(object: TObject): TObject;
        <TResult>(object: any, ...otherArgs: any[]): TResult;
    };
    debounce: <T extends Function>(func: T, wait?: number | undefined, options?: _.DebounceSettings | undefined) => T & _.Cancelable;
    square: (x: number) => number;
    sleep(ms: number): void;
    uid(): string;
    scale(x: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number): number;
    constrain(x: number, lower: number, upper: number): number;
    range(lower: number, upper: number, tick: number): number[];
};
