import Device from "../../core/Device"
import fields from "./fields"

class Generator extends Device {
  constructor(config) {
    super(config)
    //Set static config for this asset
    this.config.method = "tcp";
    this.config.options.slaveId = 1;
    //Open the connection to modbus
    super.connect();
  }

  /*
    All discover methods should emit the measurement to the measurement topic
  */

  async discover() {
    try {
      //Fetch the sensors list
      const sensors = Object.keys(fields)

      for (const sensor of sensors) {
        const source = fields[sensor];
        const artifact = sensor;
        //Emit the create measure event
        super.emit('discover', artifact, source, this.getReading)
      }

      //Create other measures
      super.emit('discover', "engine_runtime", 6689, this.engineRunTime)
      super.emit('discover', "breaker_main", 1112, this.mainBreaker)
      super.emit('discover', "breaker_generator", 1112, this.generatorBreaker)
      super.emit('discover', "bus_condition", 1113, this.busCondition)
      super.emit('discover', "controller_state", 1104, this.controllerState)

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
      let measurements = this.measurements

      if(!measurements || measurements.length === 0){
        super.emit('error', {
          code: 'InvalidData',
          message: 'Measurements for the asset do not exist'
        })
      }

      //Loop through the measures and emit a record for the reading
      for (const measure of measurements) {
        if(measure.scope === 'asset'){
          const reading = await measure.method.call(this, measure.source)
          super.emit('record', measure.artifact, reading)
        }
      }

      super.emit('ready')

    } catch (err) {
      super.emit('error', err)
    }
  }

  async getReading(source) {
    try{
      const data = await super.readHoldingRegisters({
        address: source,
        quantity: 2
      })

      const t1 = data[0].swap16()
      const t2 = data[1].swap16()
      const buf = Buffer.concat([t1, t2])
      const reading = buf.readFloatLE(0)
      return reading
    }catch(err){
      throw err
    }
  }

  async engineRunTime() {
    try{
      const data = await super.readHoldingRegisters({
        address: 6689,
        quantity: 4
      }).catch(err => Error(err));

      const hours = Buffer.concat([data[0].swap16(), data[1].swap16()]).readUInt32LE();
      const minutes = Buffer.concat([data[2].swap16(), data[3].swap16()]).readUInt32LE();
      const runtime = `Hours:${hours} Minutes:${minutes}`
      return runtime
    }catch(err){
      throw err
    }
  }

  async mainBreaker() {
    try{
      const data = await super.readHoldingRegisters({
        address: 1112,
        quantity: 1
      }).catch(err => Error(err));
      const binary = data[0].readUInt16BE(0).toString(2).split("").reverse().join("")

      return {
        "status": Number(binary.slice(10, 11)),
        "syncFail": Number(binary.slice(11, 12)),
        "closeFail": Number(binary.slice(12, 13)),
        "openFail": Number(binary.slice(13, 14))
      }
    }catch(err){
      throw err
    }
  }

  async generatorBreaker() {
    try{
      const data = await super.readHoldingRegisters({
        address: 1112,
        quantity: 1
      }).catch(err => Error(err));
      const binary = data[0].readUInt16BE(0).toString(2).split("").reverse().join("")

      return {
        "status": Number(binary.slice(6, 7)),
        "syncFail": Number(binary.slice(7, 8)),
        "closeFail": Number(binary.slice(8, 9)),
        "openFail": Number(binary.slice(9, 10))
      }
    }catch(err){
      throw err
    }
  }

  async busCondition() {
    try{
      const data = await super.readHoldingRegisters({
        address: 1113,
        quantity: 2
      }).catch(err => Error(err));

      let binary = data[0].readUInt16BE(0).toString(2).split("").reverse().join("")
      let binary1 = data[1].readUInt16BE(0).toString(2).split("").reverse().join("")

      let condition = 'unknown'

      if(Number(binary.slice(15, 16)) == 1){
        condition = 'dead'
      }

      if(Number(binary1.slice(0, 1)) == 1){
        condition = 'failed'
      }

      if(Number(binary1.slice(1, 2)) == 1){
        condition = 'stable'
      }

      return condition
    }catch(err){
      throw err
    }
  }

  async controllerState() {
    try{
      const data = await super.readHoldingRegisters({
        address: 1104,
        quantity: 1
      }).catch(err => Error(err));

      let binary = data[0].readUInt16BE(0).toString(2).split("").reverse().join("")

      let state = 'unknown'

      if(Number(binary.slice(10, 11)) == 1){
        state = 'ready'
      }

      if(Number(binary.slice(13, 14)) == 1){
        state = 'running'
      }

      if(Number(binary.slice(14, 15)) == 1){
        state = 'alarm'
      }

      return state
    }catch(err){
      throw err
    }
  }

}


export default Generator
