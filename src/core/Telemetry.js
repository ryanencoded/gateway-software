/*
 This is the main library that handles all telemetry logic
 including iot connection, iot jobs, and network data
*/
import cp from 'child_process'
import EventEmitter from "events"
import awsIot from "aws-iot-device-sdk"
import Measurement from './Measurement'

class Telemetry extends Measurement {
  constructor(config) {
    super(config)
    //Connect to iot
    this.connect()
    //Initializes the watch timer
    this.watch()
    //Initialize software updater
    this.software()
  }

  //Connects to AWS IoT
  connect() {
    if(this.config && this.config.certs){
      this.iot = awsIot.jobs(this.config.certs);

      //Emit connect
      this.iot.on('connect', () => super.emit('connect'))
      //Emit message
      this.iot.on('message', (topic, payload) => super.emit('message', topic, payload));
      //Emit error
      this.iot.on('error', (error) => super.emit('error', error));
      //Subscribe to jobs for this asset
      this.iot.startJobNotifications(this.config.asset, (err) => err && super.emit('error', err))

    }else{
      throw "There are no certs available for IoT connection"
    }
  }

  //Upload the telemetry data to iot
  upload() {
    const set = super.build()
    if(Object.keys(set).length >= 3){
      this.iot.publish("$aws/rules/AssetTelemetryData/"+this.config.asset+"/telemetry/data", JSON.stringify(set), {}, () => {
        super.emit('upload', set)
      })
    }
  }

  //Setup the timer for sending telemetry data
  watch() {
    this.timer = setInterval(() => this.upload(), (this.config.interval ? this.config.interval : 60000));
  }
  //Stops sending telemetry data to cloud
  stop() {
    if(this.timer){
      clearInterval(this.timer)
    }else{
      super.emit('error', {
        name: 'OperationFailed',
        message: 'There is no timer to clear for the telemetry'
      })
    }
  }

  software(){
    //Updates the iot software library
    this.iot.subscribeToJobs(this.config.asset, 'softwareUpdate', async (err, job) => {
      const worker = cp.fork('./software/SoftwareWorker.js')

      worker.on('message', (x) => {
        if (x.command == 'progress') {
          job.inProgress({
            step: x.step,
            progress: x.progress
          })
        }

        if (x.command == 'failed') {
          job.failed({
            reason: x.message,
            progress: x.progress
          })
        }

        if (x.command == 'finish') {
          job.succeeded({
            progress: x.progress
          });

          setTimeout(function() {
            console.log("Terminating Script");
            process.exit();
          }, 5000);
        }

      });

      worker.send({
        command: "start",
        data: job.document
      });

    })
  }

}

export default Telemetry
