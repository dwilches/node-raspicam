import { Raspicam } from '../dist/raspicam';
// const RaspiCam = require('../dist/raspicam');

console.log('Raspicam: ', Raspicam);


const camera = Raspicam.create({
  mode: 'photo',
  output: './photo/image.jpg',
  encoding: 'jpg',
  timeout: 0 // take the picture immediately
});

camera.on('start', function( err, timestamp ){
  console.log('photo started at ' + timestamp );
});

camera.on('read', function( err, timestamp, filename ){
  console.log('photo image captured with filename: ' + filename );
});

camera.on('exit', function( timestamp ){
  console.log('photo child process has exited at ' + timestamp );
});

camera.start();
