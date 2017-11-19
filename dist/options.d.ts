export declare type RaspicamMode = 'photo' | 'timelapse' | 'video';
export interface RaspicamOptions {
    mode: RaspicamMode;
    log: (...loggable: any[]) => void;
    filepath: string;
    filename: string;
    delay: number;
    width: number;
    height: number;
    rotation: number;
    quality: number;
    encoding: 'jpg' | 'bmp' | 'gif' | 'png';
    timeout: number;
}
export interface ImageParameters {
    width: number;
    height: number;
    quality: number;
    timeout: number;
    sharpness: number;
    annotate: string;
    contrast: number;
    brightness: number;
    saturation: number;
    rotation: number;
    shutter: number;
    output: string;
    exposure: ExposureMode;
    awb: AWBMode;
    decimate: boolean;
    hflip: boolean;
    vflip: boolean;
    ISO: boolean;
    vstab: boolean;
}
export declare const imageFlags: (keyof ImageParameters)[];
export declare const imageControls: (keyof ImageParameters)[];
export declare type ExposureMode = 'off' | 'auto' | 'night' | 'nightpreview' | 'backlight' | 'spotlight' | 'sports' | 'snow' | 'beach' | 'verylong' | 'fixedfps' | 'antishake' | 'fireworks';
export declare type AWBMode = 'off' | 'auto' | 'sun' | 'cloud' | 'shade' | 'tungsten' | 'fluorescent' | 'incandescent' | 'flash' | 'horizon';
