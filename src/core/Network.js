import EventEmitter from "events"
import snmp from 'net-snmp'

const fields = {
  "network_ip_address": "1.3.6.1.4.1.20542.9.1.1.1.301.0",
  "network_gps_fix": "1.3.6.1.4.1.20542.9.1.1.7.900.0",
  "network_latitude": "1.3.6.1.4.1.20542.9.1.1.7.902.0",
  "network_longitude": "1.3.6.1.4.1.20542.9.1.1.7.903.0",
  "network_board_temperture": "1.3.6.1.4.1.20542.9.1.1.1.267.0",
  "network_rssi": "1.3.6.1.4.1.20542.9.1.1.1.261.0",
  "network_state": "1.3.6.1.4.1.20542.9.1.1.1.259.0",
  "network_cellular_bytes_sent": "1.3.6.1.4.1.20542.9.1.1.1.283.0",
  "network_cellular_bytes_recieved": "1.3.6.1.4.1.20542.9.1.1.1.284.0",
  "network_device_name": "1.3.6.1.4.1.20542.9.1.1.1.1154.0",
  "network_electronic_id": "1.3.6.1.4.1.20542.9.1.1.2.10.0",
  "network_service_type": "1.3.6.1.4.1.20542.9.1.1.1.264.0",
  "network_power_in": "1.3.6.1.4.1.20542.9.1.1.1.266.0"
}

class Network extends EventEmitter{
  constructor(config) {
    super(config)
    const defaults = {
      port: 161,
      host: '192.168.9.1'
    };
    Object.assign(this, defaults, config)
    //Sets the empty measurements array
    this.measurements = []
    //Connect to snmp
    this.connect();
  }

  connect() {
    this.session = snmp.createSession(this.host, "public", {
      port: this.port
    });
  }

  close() {
    this.session.close();
  }

  //Sets a timer to fetch the current measurements
  watch() {
    this.timer = setInterval(() => this.monitor(), 5000);
  }

  //Stops the watch timer
  stop() {
    if(this.timer){
      clearInterval(this.timer)
    }else{
      this.emit('error', 'There is no timer to clear on the network')
    }
  }

  //Refreshes the measurements with current
  refresh(measurements){
    if(measurements == null || typeof measurements !== 'object'){
      this.emit('error', {
        name: 'IllegalArgument',
        message: 'The measurements for the asset were not provided or is not an array'
      })
    }

    this.measurements = measurements
  }

  discover(){
    const artifacts = Object.keys(fields)
    for(const artifact of artifacts){
      const oid = fields[artifact]
      this.emit('discover', artifact, oid, this.fetch)
    }

    this.watch()
  }

  async monitor(){

    const measurements = this.measurements

    if(!measurements || measurements.length === 0){
      this.emit('error', {
        name: 'InvalidData',
        message: 'Measurements for the network do not exist'
      })
    }


    for (const measure of measurements) {
      if(measure.scope === 'network'){
        try{
          const reading = await measure.method.call(this, measure.source)
          super.emit('record', measure.artifact, reading)
        }catch(e){
          this.emit('error', e)
        }
      }
    }

    this.emit('ready')
  }

  fetch(oid) {
    return new Promise((resolve, reject) => {
      this.session.get([oid], (err, results) => {
        if (err) reject(err)

        if(typeof results !== 'undefined' && results.length > 0){
          const reading = (Buffer.isBuffer(results[0].value) ? results[0].value.toString() : results[0].value)
          resolve(reading)
        }else{
          reject({
            name: 'InvalidData',
            message: 'The results of the network fetch are invalid'
          })
        }

      })
    })
  }

}

export default Network
