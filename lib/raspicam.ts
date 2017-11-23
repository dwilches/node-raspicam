/*
  Link to the hardware: https://www.raspberrypi.org/documentation/hardware/camera/README.md
  Link to software: https://www.raspberrypi.org/documentation/raspbian/applications/camera.md
*/
import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import { RaspicamOptions, imageFlags, imageControls } from './options';

// maximum timeout allowed by raspicam command
const INFINITY_MS = 999999999;

const COMMANDS = {
    'photo': '/opt/vc/bin/raspistill',
    'timelapse': '/opt/vc/bin/raspistill',
    'video':  '/opt/vc/bin/raspivid'
};

const DEFAULT_OPTIONS: RaspicamOptions = {
    mode: 'photo',
    output: `./image-${new Date().toUTCString()}.jpg`,
    encoding: 'jpg',
    quality: 75,
    rotation: 0,
    width: 640,
    height: 480,
    delay: 0,
    timeout: 1,
    debug: console.log.bind(console, chalk.magenta('raspicam')),
    log: console.log.bind(console, chalk.green('raspicam')),
    verbose: false
};

export class Raspicam extends EventEmitter  {

    private childProcess: ChildProcess|null = null;
    private watcher: fs.FSWatcher|null = null;
    private basedir: string;

    public opts: RaspicamOptions;

    public constructor(partialOpts: Partial<RaspicamOptions>) {
        super();

        this.opts = _.defaults(partialOpts, DEFAULT_OPTIONS);

        this.basedir = path.parse(this.opts.output).dir;

        // if not timeout provided, set to longest possible
        if (typeof this.opts.timeout === 'undefined') {
            this.opts.timeout = INFINITY_MS;
        }

        this.opts.debug('opts', this.opts);
        this.opts.debug('basedir', this.basedir);

        if (this.opts.mode === 'photo' && this.opts.timeout === 0) {
            this.opts.log("Warning: Setting timeout to 0 will cause raspistill to keep running and capture images");
        }

        process.on('exit', () => this.destroy());
    }

    destroy() {
        if (this.childProcess !== null) {
            this.childProcess.kill();
        }
    }

    watchDirectory() {
        // Create the filepath if it doesn't already exist.
        if (!fs.existsSync(this.basedir)) {
            this.opts.debug(`creating directory at "${this.basedir}", captured data will be saved there`);
            fs.mkdirSync(this.basedir);
            fs.chmodSync(this.basedir, 0o755); // set write permissions
        }

        // close previous directory watcher if any
        if (this.watcher !== null) {
            this.opts.debug('closing an existing file watcher');
            this.watcher.close();
        }

        // start watching the directory where the images will be stored to emit signals on each new photo saved
        this.opts.debug(`setting up watcher on path "${this.basedir}"`);
        this.watcher = fs.watch(this.basedir, { recursive: true })
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
    start(imageParamOverride = {}) {

        if (this.childProcess !== null) {
            return false;
        }

        const cmd = COMMANDS[this.opts.mode];
        if (!cmd) {
            this.emit('start', 'Error: mode must be photo, timelapse or video', new Date().getTime());
            return false;
        }

        const overridenOpts: {[key: string]: any} = _.defaults(imageParamOverride, this.opts);
        this.opts.debug('opts', overridenOpts);

        // build the arguments
        const args = _.chain(Object.keys(overridenOpts))
            .flatMap(opt => {
                if (_.includes(imageFlags, opt)) {
                    return [`--${opt}`];
                }
                else if (_.includes(imageControls, opt)) {
                    return [`--${opt}`, overridenOpts[opt]];
                }
                else {
                    this.opts.log(`unknown options argument: "${opt}"`);
                    return [];
                }
            })
            .value();

        args.push('--nopreview');


        this.watchDirectory();

        // start child process
        this.opts.debug('calling....');
        this.opts.debug(cmd, args);
        this.childProcess = spawn(cmd, args as string[])

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
