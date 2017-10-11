/// <reference types="node" />
import { EventEmitter } from 'events';
import { RaspicamOptions } from './options';
/**
 * @param {Object} opts Options: mode, freq, delay, width, height, quality, encoding, filepath, filename, timeout
 */
export declare class Raspicam extends EventEmitter {
    private opts;
    private child_process;
    private watcher;
    private filename;
    private filepath;
    static create(partialOpts: Partial<RaspicamOptions>): Raspicam;
    output: string;
    private constructor();
    destroy(): void;
    watchDirectory(): void;
    /**
     * start Take a snapshot or start a timelapse or video recording
     * @return {Object} instance
     */
    start(): boolean;
    stop(): boolean;
    /**
    * addChildProcessListeners()
    * Adds listeners to the child process spawned to take pictures
    * or record video (raspistill or raspivideo).
    **/
    private addChildProcessListeners(childProcess);
    get<K extends keyof RaspicamOptions>(opt: K): RaspicamOptions[K];
    set<K extends keyof RaspicamOptions>(opt: K, value: RaspicamOptions[K]): void;
}
