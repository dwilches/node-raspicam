const Rsync = require('rsync');

// Build the command
const rsync = new Rsync()
  .shell('ssh')
  .flags('ahP')
  .recursive()
  .progress()
  .exclude('.git')
  .exclude('.DS_Store')
  .source(__dirname)
  .destination('pi@192.168.1.160:/home/pi');


// Execute the command
rsync
  .output(data => console.log(data.toString()))
  .execute((error, code, cmd) => {
    if (error) {
      console.error('error: ', error);
    }
    else {
      console.log('Done! exited with code: ', code);
      console.log('Here was the command: ', cmd);
    }
  });
