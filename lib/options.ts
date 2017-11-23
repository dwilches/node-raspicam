
export type RaspicamMode = 'photo' | 'timelapse' | 'video';

export interface RaspicamOptions {
    mode: RaspicamMode;
    log: (...loggable: any[]) => void;
    debug: (...loggable: any[]) => void;
    output: string;
    delay: number;
    width: number;
    height: number;
    rotation: number;
    quality: number;
    encoding: 'jpg' | 'bmp' | 'gif' | 'png';
    timeout: number;
    verbose: boolean;
}

export const imageFlags =
    [ 'decimate'
        , 'hflip'
        , 'vflip'
        , 'ISO'
        , 'vstab'
        , 'verbose'
    ];

export const imageControls =
    [ 'output'
        , 'width'
        , 'height'
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
