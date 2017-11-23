
export type RaspicamMode = 'photo' | 'timelapse' | 'video';

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

export interface ImageParameters {
    /* Controls */
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

    /* Flags */
    decimate: boolean;
    hflip: boolean;
    vflip: boolean;
    ISO: boolean;
    vstab: boolean;
    verbose: boolean;
}

export const imageFlags: (keyof ImageParameters)[] =
    [ 'decimate'
        , 'hflip'
        , 'vflip'
        , 'ISO'
        , 'vstab'
        , 'verbose'
    ];

export const imageControls: (keyof ImageParameters)[] =
    [ 'output'
        , 'width'
        , 'height'
        // , 'annotate'
        // , 'quality'
        , 'sharpness'
        , 'contrast'
        , 'timeout'
        , 'brightness'
        , 'saturation'
        , 'rotation'
        , 'shutter'
        , 'exposure'
        , 'awb'
    ];


export type ExposureMode
    = 'off'
    | 'auto'
    | 'night'
    | 'nightpreview'
    | 'backlight'
    | 'spotlight'
    | 'sports'
    | 'snow'
    | 'beach'
    | 'verylong'
    | 'fixedfps'
    | 'antishake'
    | 'fireworks';

export type AWBMode
    = 'off'
    | 'auto'
    | 'sun'
    | 'cloud'
    | 'shade'
    | 'tungsten'
    | 'fluorescent'
    | 'incandescent'
    | 'flash'
    | 'horizon';
