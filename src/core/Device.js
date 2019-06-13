/*
 This is the Device library that handles all device logic
 including modbus support, device discovery and device monitoring
*/

import EventEmitter from 'events'
import modbus from 'modbus-stream'

class Device extends EventEmitter {
  constructor(config){
    super()
    //Setup defaults for asset
    this.config = {
      "address": "unknown",
      "method": "unknown",
      "options": {
        "debug": null,
        "crc": true
      }
    }
    //Assign the config to this.config
    Object.assign(this.config, config)

    //Validate that config has what we need
    if (!this.config.address || this.config.address == "unknown") {
      throw ("device address not provided")
    }

    if(!this.config.asset){
      throw "The asset artifact was not provided to the asset"
    }

    //Sets connected variable to false on init
    this.connected = false
    //Sets the empty measurements array
    this.measurements = []
  }

  //Refreshes the measurements with current
  refresh(measurements){
    if(measurements == null || typeof measurements !== 'object'){
      this.emit('error', {
        code: 'IllegalArgument',
        message: 'The measurements for the asset were not provided or is not an array'
      })
    }

    this.measurements = measurements
  }

  //Sets a timer to fetch the current measurements
  watch() {
    this.timer = setInterval(() => this.monitor(), (this.config.interval ? this.config.interval : 15000));
  }

  //Stops the watch timer
  stop() {
    if(this.timer){
      clearInterval(this.timer)
    }else{
      this.emit('error', 'There is no timer to clear on the asset')
    }
  }

  /* Modbus Functions */
  connect() {

    if (this.connected) {
      throw ('asset already connected to modbus')
    }

    const methods = {
      'serial': (address, options) => {
        return new Promise((resolve, reject) => {
          modbus.serial.connect(address, options, (err, connection) => {
            if (err) reject(err)
            this.connected = true;
            this.connection = connection;

            resolve(connection);
          });
        });
      },
      'tcp': (address, options) => {
        return new Promise((resolve, reject) => {
          modbus.tcp.connect(502, address, options, (err, connection) => {
            if (err) reject(err)
            this.connected = true;
            this.connection = connection;

            resolve(connection);
          });
        });
      },
      default: () => {
        throw ('device connection method not recognized');
      }
    };

    return methods[this.config.method](this.config.address, this.config.options);
  }

  close() {
    return new Promise((resolve, reject) => {
      this.connection.close((err) => {
        if (err) reject(err)
        this.connected = false;
        resolve('Connection closed to modbus');
      });
    });
  }

  readHoldingRegisters(options) {
    return new Promise(async (resolve, reject) => {
      this.connection.readHoldingRegisters(options, (err, res) => {
        if (err) reject(err)

        if (typeof res != 'object') {
          reject ("Invalid Response from holding register: "+JSON.stringify(options));
        }

        if (!res.hasOwnProperty("response")) {
          reject ("No Response from holding register: "+JSON.stringify(options));
        }

        if (res.response.hasOwnProperty("exception")) {
          reject ("Holding Register Exception: " + res.response.exception);
        }

        if (!res.response.hasOwnProperty("data")) {
          reject ("No data in response: "+JSON.stringify(options));
        }

        resolve(res.response.data);
      });
    });
  }

  readCoils (options) {
    return new Promise((resolve, reject) => {
      this.connection.readCoils(options, (err, res) => {
        if (err) {
          reject(err);
        }

        if (typeof res != 'object') {
          reject ("Invalid Response from coil");
        }

        if (!res.hasOwnProperty("response")) {
          reject ("No Response from coil");
        }

        if (res.response.hasOwnProperty("exception")) {
          reject ("Coil Exception: " + res.response.exception);
        }

        if (!res.response.hasOwnProperty("data")) {
          reject ("No data in response");
        }

        resolve(res.response.data);
      });
    });
  }

}

export default Device
