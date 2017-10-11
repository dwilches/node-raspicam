import { Raspicam } from '../dist/raspicam';
// const RaspiCam = require('../dist/raspicam');

console.log('Raspicam: ', Raspicam);

const now = new Date();

const camera = Raspicam.create({
  mode: 'photo',
  filepath: './photo',
  filename: `image-${now.toLocaleDateString()}-${now.toLocaleTimeString()}.jpg`,
  encoding: 'jpg',
  width: 640,
  height: 480,
  timeout: 0 // take the picture immediately
});

camera.on('start', function( err, timestamp ){
  console.log('photo started at ' + timestamp );
});

camera.on('read', function( err, timestamp, filename ){
  console.log('photo image captured with filename: ' + filename );
});

camera.on('exit', function( timestamp, ...args: any[] ){
  console.log('photo child process has exited at ' + timestamp );
});

camera.start();
