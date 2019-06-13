const SoftwareManager = require('./SoftwareManager')

process.on('message', (x) => {
  if (x.command == 'start') {
    start(x.data);
  }
});

async function start(data) {
  try {

    let software = new SoftwareManager();

    //Start the software download
    await software.start()
      .then(() => {
        process.send({
          command: 'progress',
          step: 'Software Update Started',
          progress: '10%'
        })
      })
    //Backup the system
    await software.backup()
      .then(() => {
        console.log('After Backup')
        process.send({
          command: 'progress',
          step: 'Software Backup Successful',
          progress: '30%'
        })
      })
    //Download the software
    await software.download(data.url)
      .then(() => {
        process.send({
          command: 'progress',
          step: 'Software Download Successful',
          progress: '60%'
        })
      })
    //Install the software
    await software.install()
      .then(() => {
        process.send({
          command: 'progress',
          step: 'Software Install Successful',
          progress: '90%'
        })
      })
    //Finish up the software install
    await software.finish()
      .then(() => {
        process.send({
          command: 'finish',
          progress: '100%'
        })
      })

  } catch (e) {
    process.send({
      command: 'failed',
      progress: '0%',
      message: JSON.stringify(e)
    })
  }


}
