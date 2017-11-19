/// <reference types="node" />
import { EventEmitter } from 'events';
import { RaspicamOptions, ImageParameters } from './options';
export declare class Raspicam extends EventEmitter {
    opts: RaspicamOptions;
    private childProcess;
    private watcher;
    private path;
    static create(partialOpts: Partial<RaspicamOptions>): Raspicam;
    private constructor();
    readonly output: string;
    destroy(): void;
    watchDirectory(): void;
    /**
     * start Take a snapshot or start a timelapse or video recording
     * @return {Object} instance
     */
    start(imageParamOverride?: Partial<ImageParameters>): boolean;
    stop(): boolean;
    get<K extends keyof RaspicamOptions>(opt: K): RaspicamOptions[K];
    set<K extends keyof RaspicamOptions>(opt: K, value: RaspicamOptions[K]): void;
}
