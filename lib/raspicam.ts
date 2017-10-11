import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as chalk from 'chalk';
import * as fs from 'fs';
import { RaspicamOptions, imageFlags, imageControls, ImageParameters } from './options';

// maximum timeout allowed by raspicam command
const INFINITY_MS = 999999999;

// commands
const PHOTO_CMD = '/opt/vc/bin/raspistill';
const TIMELAPSE_CMD = '/opt/vc/bin/raspistill';
const VIDEO_CMD = '/opt/vc/bin/raspivid';


/**
 * @param {Object} opts Options: mode, freq, delay, width, height, quality, encoding, filepath, filename, timeout
 */

export class Raspicam extends EventEmitter  {

  private child_process: ChildProcess|null = null;
  private watcher: fs.FSWatcher|null = null;
  private filename = '';
  private filepath = '';

  static create(partialOpts: Partial<RaspicamOptions>): Raspicam {
    const opts: RaspicamOptions = {
      mode: 'photo',
      output: process.cwd(),
      width: 640,
      height: 480,
      delay: 0,
      quality: 100,
      encoding: 'jpg',
      log: console.log.bind(console, chalk.magenta('raspicam')),
      timeout: INFINITY_MS,
      ...partialOpts
    };

    opts.log('opts', opts);

    return new Raspicam(opts);
  }

  set output(output: string) {
    this.opts.log(`setting output using "${output}"`);
    this.filename = output.substr(output.lastIndexOf('/') + 1);
    this.filepath = output.substr(0, output.lastIndexOf('/') + 1) || './';
    this.opts.log(`filename is "${this.filename}"`);
    this.opts.log(`filepath is "${this.filepath}"`);
  }

  private constructor(
    private opts: RaspicamOptions
  ) {
    super();
    this.output = this.opts.output;

    // Create the filepath if it doesn't already exist.
    if (!fs.existsSync(this.filepath)) {
      fs.mkdirSync(this.filepath);
      fs.chmodSync(this.filepath, 0o755); // set write permissions
    }

    this.child_process = null; // child process
    this.watcher = null; // directory watcher
    process.on('exit', () => this.destroy());
  }

  destroy() {
    if (this.child_process !== null) {
      this.child_process.kill();
    }
  }

  watchDirectory() {
    // close previous directory watcher if any
    if (this.watcher !== null) {
      this.watcher.close();
    }

    // start watching the directory where the images will be stored to emit signals on each new photo saved
    this.opts.log(`setting up watcher on path "${this.filepath}"`);
    this.watcher = fs.watch(this.filepath, (event, filename) => {
      // rename is called once, change is called 3 times, so check for rename to elimate duplicates
      if (event === 'rename') {
        this.opts.log('raspicam::watcher::event ' + event);

        // only emit read event if it is not a temporary file
        if (filename.indexOf('~') === -1) {
          this.emit('read', null, new Date().getTime(), filename);
        }
      }
      else {
        this.opts.log('raspicam::watcher::event ' + event);
        this.emit(event, null, new Date().getTime(), filename);
      }
    });
  }

  /**
   * start Take a snapshot or start a timelapse or video recording
   * @return {Object} instance
   */
  start() {

    if (this.child_process !== null) {
      return false;
    }

    this.watchDirectory();

    // build the arguments
    // var args = [];
    const args
      = Object.keys(this.opts)
          .map((opt: keyof ImageParameters) => {
            if (imageFlags.includes(opt)) {
              return `--${opt}`;
            }
            else if (imageControls.includes(opt)) {
              return `--${opt} ${this.opts[opt as keyof RaspicamOptions].toString()}`;
            }
            else {
              this.opts.log(`unknown options argument: "${opt}"`);
              return null;
            }
          })
          .filter(opt => opt !== null)
          .reduce((accum, opt: string) => [...accum, ...opt.split(' ')], []);


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

    // start child process
    this.opts.log('calling....');
    this.opts.log(cmd + ' ' + args.join(' '));
    this.child_process = spawn(cmd, args as string[]);

    // set up listeners for stdout, stderr and process exit
    this.addChildProcessListeners(this.child_process);

    this.emit('start', null, new Date().getTime());
    return true;
  }

  // stop the child process
  // return true if process was running, false if no process to kill
  stop() {

    // close previous directory watcher if any
    if (this.watcher !== null) {
      this.watcher.close();
    }

    if (this.child_process !== null) {
      this.child_process.kill();
      this.emit('stop', null, new Date().getTime());
      return true;
    }
    else {
      this.emit('stop', 'Error: no process was running', new Date().getTime());
      return false;
    }
  }

  /**
  * addChildProcessListeners()
  * Adds listeners to the child process spawned to take pictures
  * or record video (raspistill or raspivideo).
  **/
  private addChildProcessListeners(childProcess: ChildProcess) {
    childProcess.stdout.on('data', data => {
      this.opts.log('stdout: ' + data);
    });

    childProcess.stderr.on('data', data => {
      this.opts.log('stderr: ' + data);
    });

    childProcess.on('close', code => {
      this.child_process = null;

      if (this.watcher !== null) {
        this.watcher.close(); // remove the file watcher
        this.watcher = null;
      }

      // emit exit signal for process chaining over time
      this.emit('exit', new Date().getTime());
    });
  }

  get<K extends keyof RaspicamOptions>(opt: K): RaspicamOptions[K] {
    return this.opts[opt];
  }

  set<K extends keyof RaspicamOptions>(opt: K, value: RaspicamOptions[K]) {
    this.opts[opt] = value;
  }
}

/*
Converts any abbreviated opts to their full word equivalent and assigns to this.
hashOpts(opts) {
  for(let opt in opts) {
    if (opt.length <= 3) {

      // if this opt is in the parameters hash
      if (typeof parameters[opt] !== 'undefined') {

        // reassign it to the full word
        this.opts[parameters[opt]] = opts[opt];
        delete this.opts[opt];
      }

      // if this opt is in the flags hash
      if (typeof flags[opt] !== 'undefined') {

        // reassign it to the full word
        this.opts[flags[opt]] = opts[opt];
        delete this.opts[opt];
      }
    }
  }
}
*/
