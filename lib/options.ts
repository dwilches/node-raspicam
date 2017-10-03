
export type RaspicamMode = 'photo' | 'timelapse' | 'video';

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
  /* Controls */
  width: number;
  height: number;
  quality: number;
  sharpness: number;
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
}

export const imageFlags: (keyof ImageParameters)[] =
  [ 'decimate'
  , 'hflip'
  , 'vflip'
  , 'ISO'
  , 'vstab'
  ];

export const imageControls: (keyof ImageParameters)[] =
  [ 'output'
  , 'width'
  , 'height'
  , 'quality'
  , 'sharpness'
  , 'contrast'
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
