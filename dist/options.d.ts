export declare type RaspicamMode = 'photo' | 'timelapse' | 'video';
export interface RaspicamOptions {
    mode: RaspicamMode;
    log: (...loggable: any[]) => void;
    debug: (...loggable: any[]) => void;
    filepath: string;
    filename: string;
    delay: number;
    width: number;
    height: number;
    rotation: number;
    quality: number;
    encoding: 'jpg' | 'bmp' | 'gif' | 'png';
    timeout: number;
    verbose: boolean;
}
export declare const imageFlags: string[];
export declare const imageControls: string[];
