/*
  Link to the hardware: https://www.raspberrypi.org/documentation/hardware/camera/README.md
  Link to software: https://www.raspberrypi.org/documentation/raspbian/applications/camera.md

  Warnings:
  - Setting timeout to 0 will cause raspistill to keep running and capture images
*/
import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
// import * as strftime from 'strftime';
import { RaspicamOptions, imageFlags, imageControls, ImageParameters } from './options';

// maximum timeout allowed by raspicam command
const INFINITY_MS = 999999999;

// commands
const PHOTO_CMD = '/opt/vc/bin/raspistill';
const TIMELAPSE_CMD = '/opt/vc/bin/raspistill';
const VIDEO_CMD = '/opt/vc/bin/raspivid';

const DEFAULT_OPTIONS: RaspicamOptions = {
    mode: 'photo',
    filename: 'image.jpg',
    filepath: process.cwd(),
    encoding: 'jpg',
    delay: 0,
    height: 480,
    quality: 75,
    rotation: 0,
    timeout: 1,
    width: 640,
    debug: console.log.bind(console, chalk.magenta('raspicam')),
    log: console.log.bind(console, chalk.green('raspicam'))
};

export class Raspicam extends EventEmitter  {

    private childProcess: ChildProcess|null = null;
    private watcher: fs.FSWatcher|null = null;
    private path: path.ParsedPath;

    public opts: RaspicamOptions;

    public constructor(partialOpts: Partial<RaspicamOptions>) {
        super();

        this.opts = _.defaults(this.opts, DEFAULT_OPTIONS);

        const { filename, filepath } = this.opts;
        this.path = path.parse(path.resolve(process.cwd(), filepath, filename));

        this.opts.debug('opts', this.opts);
        this.opts.debug('path', this.path);

        process.on('exit', () => this.destroy());
    }

    get output(): string {
        return path.resolve(this.path.dir, this.path.base);
    }

    destroy() {
        if (this.childProcess !== null) {
            this.childProcess.kill();
        }
    }

    watchDirectory() {
        // Create the filepath if it doesn't already exist.
        if (!fs.existsSync(this.path.dir)) {
            this.opts.debug(`creating directory at "${this.path.dir}", captured data will be saved there`);
            fs.mkdirSync(this.path.dir);
            fs.chmodSync(this.path.dir, 0o755); // set write permissions
        }

        // close previous directory watcher if any
        if (this.watcher !== null) {
            this.opts.debug('closing an existing file watcher');
            this.watcher.close();
        }

        // start watching the directory where the images will be stored to emit signals on each new photo saved
        this.opts.debug(`setting up watcher on path "${this.path.dir}"`);
        this.watcher = fs.watch(this.path.dir, { recursive: true })
            .on('error', error => console.error('fs.watch error: ', error))
            // 'rename' is emitted whenever a filename appears or disappears in the directory
            .on('change', (event, filename) => {
                // this.opts.log(`watcher "${event}" event from file: ${filename}`);

                // rename is called once, change is called 3 times, so check for rename to elimate duplicates
                if (event === 'rename') {
                    // only emit read event if it is not a temporary file
                    if (!filename.toString().endsWith('~')) {
                        this.emit('read', null, new Date().getTime(), filename);
                    }
                }
                else {
                    this.emit(event, null, new Date().getTime(), filename);
                }
            });
    }

    /**
     * start Take a snapshot or start a timelapse or video recording
     * @return {Object} instance
     */
    start(imageParamOverride: Partial<ImageParameters> = {}) {

        if (this.childProcess !== null) {
            return false;
        }

        let cmd;

        switch(this.opts.mode) {
            case 'photo':
                cmd = PHOTO_CMD;
                break;
            case 'timelapse':
                cmd = TIMELAPSE_CMD;

                // if no timelapse frequency provided, return false
                // if (typeof this.opts.timelapse === 'undefined') {
                //   this.emit('start', 'Error: must specify timelapse frequency option', new Date().getTime());
                //   return false;
                // }
                // if not timeout provided, set to longest possible
                if (typeof this.opts.timeout === 'undefined') {
                    this.opts.timeout = INFINITY_MS;
                }
                break;
            case 'video':
                cmd = VIDEO_CMD;
                break;
            default:
                this.emit('start', 'Error: mode must be photo, timelapse or video', new Date().getTime());
                return false;
        }

        // build the arguments
        const args
            = Object.keys(this.opts)
            .map((opt: keyof ImageParameters) => {
                if (_.includes(imageFlags, opt)) {
                    return `--${opt}`;
                }
                else if (_.includes(imageControls, opt)) {
                    return `--${opt} ${imageParamOverride[opt] || this.opts[opt as keyof RaspicamOptions].toString()}`;
                }
                else {
                    this.opts.log(`unknown options argument: "${opt}"`);
                    return null;
                }
            })
            .filter(opt => opt !== null)
            .reduce(
                (accum, opt: string) => [...accum, ...opt.split(' ')],
                ['--output', this.output, '--nopreview', '--verbose']
            );


        this.watchDirectory();

        // start child process
        this.opts.debug('calling....');
        this.opts.debug(cmd + args.join(' '));
        this.childProcess
            = spawn(cmd, args as string[])
        // The 'exit' event is emitted after the child process ends.
        // If the process exited, code is the final exit code of the process, otherwise null.
        // If the process terminated due to receipt of a signal,
        // signal is the string name of the signal, otherwise null.
        // One of the two will always be non-null.
        // Note that when the 'exit' event is triggered,
        // child process stdio streams might still be open.
            .on('exit', (code, signal) => this.opts.debug('exit event, code: ', code, ' signal: ', signal))
            .on('disconnect', () => this.opts.debug('disconnect event'))
            .on('error', error => this.opts.debug('error event', error))
            .on('message', message => this.opts.debug('message event', message))
            .on('readable', () => this.opts.debug('readable event'))
            // The 'close' event is emitted when the stdio streams of a child process have been closed
            .on('close', (code, signal) => {
                this.opts.debug('close event, code: ', code, ' signal: ', signal);
                // emit exit signal for process chaining over time
                this.emit('exit', new Date().getTime());
            });

        // set up listeners for stdout, stderr and process exit
        this.childProcess.stdout.on('data', data => {
            this.opts.debug('stdout: ' + data);
        });

        this.childProcess.stderr.on('data', data => {
            this.opts.log('stderr: ' + data);
        });


        this.emit('start', null, new Date().getTime());
        return true;
    }

    // stop the child process
    // return true if process was running, false if no process to kill
    stop() {
        // close previous directory watcher if any
        if (this.watcher !== null) {
            this.watcher.close();
            this.watcher = null;
        }

        if (this.childProcess !== null) {
            this.childProcess.kill();
            this.childProcess = null;
            this.emit('stop', null, new Date().getTime());
            return true;
        }
        else {
            this.emit('stop', 'Error: no process was running', new Date().getTime());
            return false;
        }
    }

    get<K extends keyof RaspicamOptions>(opt: K): RaspicamOptions[K] {
        return this.opts[opt];
    }

    set<K extends keyof RaspicamOptions>(opt: K, value: RaspicamOptions[K]) {
        this.opts[opt] = value;
    }
}
