"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var child_process_1 = require("child_process");
var chalk = require("chalk");
var fs = require("fs");
var options_1 = require("./options");
// maximum timeout allowed by raspicam command
var INFINITY_MS = 999999999;
// commands
var PHOTO_CMD = '/opt/vc/bin/raspistill';
var TIMELAPSE_CMD = '/opt/vc/bin/raspistill';
var VIDEO_CMD = '/opt/vc/bin/raspivid';
/**
 * @param {Object} opts Options: mode, freq, delay, width, height, quality, encoding, filepath, filename, timeout
 */
var Raspicam = /** @class */ (function (_super) {
    __extends(Raspicam, _super);
    function Raspicam(opts) {
        var _this = _super.call(this) || this;
        _this.opts = opts;
        _this.child_process = null;
        _this.watcher = null;
        _this.filename = '';
        _this.filepath = '';
        _this.output = _this.opts.output;
        // Create the filepath if it doesn't already exist.
        if (!fs.existsSync(_this.filepath)) {
            fs.mkdirSync(_this.filepath);
            fs.chmodSync(_this.filepath, 493); // set write permissions
        }
        _this.child_process = null; // child process
        _this.watcher = null; // directory watcher
        process.on('exit', function () { return _this.destroy(); });
        return _this;
    }
    Raspicam.create = function (partialOpts) {
        var opts = __assign({ mode: 'photo', output: process.cwd(), width: 640, height: 480, delay: 0, quality: 100, encoding: 'jpg', log: console.log.bind(console, chalk.magenta('raspicam')), timeout: INFINITY_MS }, partialOpts);
        opts.log('opts', opts);
        return new Raspicam(opts);
    };
    Object.defineProperty(Raspicam.prototype, "output", {
        set: function (output) {
            this.opts.log("setting output using \"" + output + "\"");
            this.filename = output.substr(output.lastIndexOf('/') + 1);
            this.filepath = output.substr(0, output.lastIndexOf('/') + 1) || './';
            this.opts.log("filename is \"" + this.filename + "\"");
            this.opts.log("filepath is \"" + this.filepath + "\"");
        },
        enumerable: true,
        configurable: true
    });
    Raspicam.prototype.destroy = function () {
        if (this.child_process !== null) {
            this.child_process.kill();
        }
    };
    Raspicam.prototype.watchDirectory = function () {
        var _this = this;
        // close previous directory watcher if any
        if (this.watcher !== null) {
            this.watcher.close();
        }
        // start watching the directory where the images will be stored to emit signals on each new photo saved
        this.opts.log("setting up watcher on path \"" + this.filepath + "\"");
        this.watcher = fs.watch(this.filepath, function (event, filename) {
            // rename is called once, change is called 3 times, so check for rename to elimate duplicates
            if (event === 'rename') {
                _this.opts.log('raspicam::watcher::event ' + event);
                // only emit read event if it is not a temporary file
                if (filename.indexOf('~') === -1) {
                    _this.emit('read', null, new Date().getTime(), filename);
                }
            }
            else {
                _this.opts.log('raspicam::watcher::event ' + event);
                _this.emit(event, null, new Date().getTime(), filename);
            }
        });
    };
    /**
     * start Take a snapshot or start a timelapse or video recording
     * @return {Object} instance
     */
    Raspicam.prototype.start = function () {
        var _this = this;
        if (this.child_process !== null) {
            return false;
        }
        this.watchDirectory();
        // build the arguments
        // var args = [];
        var args = Object.keys(this.opts)
            .map(function (opt) {
            if (options_1.imageFlags.includes(opt)) {
                return "--" + opt;
            }
            else if (options_1.imageControls.includes(opt)) {
                return "--" + opt + " " + _this.opts[opt].toString();
            }
            else {
                _this.opts.log("unknown options argument: \"" + opt + "\"");
                return null;
            }
        })
            .filter(function (opt) { return opt !== null; })
            .reduce(function (accum, opt) { return accum.concat(opt.split(' ')); }, []);
        var cmd;
        switch (this.opts.mode) {
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
        this.child_process = child_process_1.spawn(cmd, args);
        // set up listeners for stdout, stderr and process exit
        this.addChildProcessListeners(this.child_process);
        this.emit('start', null, new Date().getTime());
        return true;
    };
    // stop the child process
    // return true if process was running, false if no process to kill
    Raspicam.prototype.stop = function () {
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
    };
    /**
    * addChildProcessListeners()
    * Adds listeners to the child process spawned to take pictures
    * or record video (raspistill or raspivideo).
    **/
    Raspicam.prototype.addChildProcessListeners = function (childProcess) {
        var _this = this;
        childProcess.stdout.on('data', function (data) {
            _this.opts.log('stdout: ' + data);
        });
        childProcess.stderr.on('data', function (data) {
            _this.opts.log('stderr: ' + data);
        });
        childProcess.on('close', function (code) {
            _this.child_process = null;
            if (_this.watcher !== null) {
                _this.watcher.close(); // remove the file watcher
                _this.watcher = null;
            }
            // emit exit signal for process chaining over time
            _this.emit('exit', new Date().getTime());
        });
    };
    Raspicam.prototype.get = function (opt) {
        return this.opts[opt];
    };
    Raspicam.prototype.set = function (opt, value) {
        this.opts[opt] = value;
    };
    return Raspicam;
}(events_1.EventEmitter));
exports.Raspicam = Raspicam;
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
