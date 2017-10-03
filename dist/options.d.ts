export declare type RaspicamMode = 'photo' | 'timelapse' | 'video';
export interface RaspicamOptions {
    mode: RaspicamMode;
    log: (...loggable: any[]) => void;
    output: string;
    delay: number;
    width: number;
    height: number;
    quality: number;
    encoding: 'jpg' | 'bmp' | 'gif' | 'png';
    timeout: number;
}
export interface ImageParameters {
    width: number;
    height: number;
    quality: number;
    sharpness: number;
    contrast: number;
    brightness: number;
    saturation: number;
    rotation: number;
    shutter: number;
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