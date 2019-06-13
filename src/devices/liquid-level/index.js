import Device from "../../core/Device"

class LiquidLevel extends Device {
  constructor(config) {
    super(config);
    //Set static config for this asset
    this.config.method = "serial";
    this.config.options.baudRate = 9600

    super.connect();
  }

  /*
    All discover methods should emit the measurement to the measurement topic
  */

  async discover() {
    try {
      //Reset the measures array
      super.measures = []
      //Generate sensor list
      let sensors = [];
      for (let i = 0; i < 246; i++) {
        const sensor = (i + 1);
        sensors.push(sensor);
      }

      for (const sensor of sensors) {
        const status = await this.getStatus(sensor);

        if (status == 1) {

          //Do a quick reading to determine if one or two channels will be created
          const data = await super.readHoldingRegisters({
            address: 1007,
            quantity: 2,
            extra: {
              slaveId: sensor
            }
          });

          //If number itself is > 1000, then its on
          const loopA = data[0].readUInt16BE(0);
          const loopB = data[1].readUInt16BE(0);

          if (loopA >= 1000) {
            const source = 1007;
            const artifact = 'measure_'+sensor+'_loopA';
            super.measure({
              "artifact": artifact,
              "source": source
            })
          }

          if (loopB >= 1000) {
            const source = 1008;
            const artifact = 'measure)'+sensor+'_loopB';
            super.measure({
              "artifact": artifact,
              "source": source
            })
          }
        }
      }

      //Tell the device to watch the measures
      super.watch()

    } catch (err) {
      super.emit('error', err)
    }
  }

  /* The Device class parent will call this function every interval */
  async monitor() {
    try {
      //Fetch the measures
      let measures = this.measures

      //Loop through the measures and emit a record for the reading
      for (const measure of measures) {
        const reading = await this.getReading(measure)
        Object.assign(measure, {
          "reading": reading,
          "measuredAt": Date.now()
        })
        super.emit('measure', measure)
      }

      super.emit('finish')
    } catch (err) {
      super.emit('error', err)
    }
  }

  async getConfig() {
    try {
      const data = await super.readHoldingRegisters({
        address: 2024,
        quantity: 9,
        extra: {
          slaveId: 247
        }
      });

      let val = data[0].readUInt16BE(0).toString(2);
      return val;
    } catch (err) {
      throw (err);
    }
  }

  async getStatus(sensor) {
    try {

      const index = Math.floor(sensor / 16);
      const bit = (sensor % 16);
      const address = (2009 + index);

      const data = await super.readHoldingRegisters({
        address: address,
        quantity: 1,
        extra: {
          slaveId: 247
        }
      });

      let binary = data[0].readUInt16BE(0).toString(2);
      let reverseBinary = binary.split("").reverse().join("");
      let val = Number(reverseBinary.slice(bit, bit + 1));
      return val;

    } catch (err) {
      throw (err);
    }
  }

  async getReading(measure) {
    try {
      const [type, sensor] = measure.artifact.split("_")
      const data = await super.readHoldingRegisters({
        address: measure.source,
        quantity: 1,
        extra: {
          slaveId: sensor
        }
      });

      let reading = data[0].readUInt16BE(0);
      return reading;
    } catch (err) {
      throw (err);
    }
  }


}

export default LiquidLevel
