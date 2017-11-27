/// <reference types="node" />
import { EventEmitter } from 'events';
import { RaspicamOptions } from './options';
export declare class Raspicam extends EventEmitter {
    private childProcess;
    private watcher;
    private basedir;
    private cmd;
    opts: RaspicamOptions;
    constructor(partialOpts: Partial<RaspicamOptions>);
    killChildProcess(): void;
    watchDirectory(): void;
    /**
     * start Take a snapshot or start a timelapse or video recording
     * @return {Object} instance
     */
    start(imageParamOverride?: {}): boolean | undefined;
    stop(): boolean;
    get<K extends keyof RaspicamOptions>(opt: K): RaspicamOptions[K];
    set<K extends keyof RaspicamOptions>(opt: K, value: RaspicamOptions[K]): void;
}
