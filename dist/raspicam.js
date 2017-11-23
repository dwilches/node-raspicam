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
Object.defineProperty(exports, "__esModule", { value: true });
/*
  Link to the hardware: https://www.raspberrypi.org/documentation/hardware/camera/README.md
  Link to software: https://www.raspberrypi.org/documentation/raspbian/applications/camera.md

  Warnings:
  - Setting timeout to 0 will cause raspistill to keep running and capture images
*/
var events_1 = require("events");
var child_process_1 = require("child_process");
var chalk = require("chalk");
var fs = require("fs");
var path = require("path");
var _ = require("lodash");
// import * as strftime from 'strftime';
var options_1 = require("./options");
// maximum timeout allowed by raspicam command
var INFINITY_MS = 999999999;
var COMMANDS = {
    'photo': '/opt/vc/bin/raspistill',
    'timelapse': '/opt/vc/bin/raspistill',
    'video': '/opt/vc/bin/raspivid'
};
var DEFAULT_OPTIONS = {
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
    log: console.log.bind(console, chalk.green('raspicam')),
    verbose: false
};
var Raspicam = /** @class */ (function (_super) {
    __extends(Raspicam, _super);
    function Raspicam(partialOpts) {
        var _this = _super.call(this) || this;
        _this.childProcess = null;
        _this.watcher = null;
        _this.opts = _.defaults(_this.opts, DEFAULT_OPTIONS);
        var _a = _this.opts, filename = _a.filename, filepath = _a.filepath;
        _this.path = path.parse(path.resolve(process.cwd(), filepath, filename));
        // if not timeout provided, set to longest possible
        if (typeof _this.opts.timeout === 'undefined') {
            _this.opts.timeout = INFINITY_MS;
        }
        _this.opts.debug('opts', _this.opts);
        _this.opts.debug('path', _this.path);
        process.on('exit', function () { return _this.destroy(); });
        return _this;
    }
    Object.defineProperty(Raspicam.prototype, "output", {
        get: function () {
            return path.resolve(this.path.dir, this.path.base);
        },
        enumerable: true,
        configurable: true
    });
    Raspicam.prototype.destroy = function () {
        if (this.childProcess !== null) {
            this.childProcess.kill();
        }
    };
    Raspicam.prototype.watchDirectory = function () {
        var _this = this;
        // Create the filepath if it doesn't already exist.
        if (!fs.existsSync(this.path.dir)) {
            this.opts.debug("creating directory at \"" + this.path.dir + "\", captured data will be saved there");
            fs.mkdirSync(this.path.dir);
            fs.chmodSync(this.path.dir, 493); // set write permissions
        }
        // close previous directory watcher if any
        if (this.watcher !== null) {
            this.opts.debug('closing an existing file watcher');
            this.watcher.close();
        }
        // start watching the directory where the images will be stored to emit signals on each new photo saved
        this.opts.debug("setting up watcher on path \"" + this.path.dir + "\"");
        this.watcher = fs.watch(this.path.dir, { recursive: true })
            .on('error', function (error) { return console.error('fs.watch error: ', error); })
            .on('change', function (event, filename) {
            // this.opts.log(`watcher "${event}" event from file: ${filename}`);
            // rename is called once, change is called 3 times, so check for rename to elimate duplicates
            if (event === 'rename') {
                // only emit read event if it is not a temporary file
                if (!filename.toString().endsWith('~')) {
                    _this.emit('read', null, new Date().getTime(), filename);
                }
            }
            else {
                _this.emit(event, null, new Date().getTime(), filename);
            }
        });
    };
    /**
     * start Take a snapshot or start a timelapse or video recording
     * @return {Object} instance
     */
    Raspicam.prototype.start = function (imageParamOverride) {
        var _this = this;
        if (imageParamOverride === void 0) { imageParamOverride = {}; }
        if (this.childProcess !== null) {
            return false;
        }
        var cmd = COMMANDS[this.opts.mode];
        if (!cmd) {
            this.emit('start', 'Error: mode must be photo, timelapse or video', new Date().getTime());
            return false;
        }
        var overridenOpts = _.defaults(imageParamOverride, this.opts);
        this.opts.debug('opts', overridenOpts);
        // build the arguments
        var args = _.chain(Object.keys(overridenOpts))
            .flatMap(function (opt) {
            if (_.includes(options_1.imageFlags, opt)) {
                return ["--" + opt];
            }
            else if (_.includes(options_1.imageControls, opt)) {
                return ["--" + opt, overridenOpts[opt]];
            }
            else {
                _this.opts.log("unknown options argument: \"" + opt + "\"");
                return [];
            }
        })
            .value();
        args.push('--output', this.output, '--nopreview');
        this.watchDirectory();
        // start child process
        this.opts.debug('calling....');
        this.opts.debug(cmd, args);
        this.childProcess = child_process_1.spawn(cmd, args)
            .on('exit', function (code, signal) { return _this.opts.debug('exit event, code: ', code, ' signal: ', signal); })
            .on('disconnect', function () { return _this.opts.debug('disconnect event'); })
            .on('error', function (error) { return _this.opts.debug('error event', error); })
            .on('message', function (message) { return _this.opts.debug('message event', message); })
            .on('readable', function () { return _this.opts.debug('readable event'); })
            .on('close', function (code, signal) {
            _this.opts.debug('close event, code: ', code, ' signal: ', signal);
            // emit exit signal for process chaining over time
            _this.emit('exit', new Date().getTime());
        });
        // set up listeners for stdout, stderr and process exit
        this.childProcess.stdout.on('data', function (data) {
            _this.opts.debug('stdout: ' + data);
        });
        this.childProcess.stderr.on('data', function (data) {
            _this.opts.log('stderr: ' + data);
        });
        this.emit('start', null, new Date().getTime());
        return true;
    };
    // stop the child process
    // return true if process was running, false if no process to kill
    Raspicam.prototype.stop = function () {
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
