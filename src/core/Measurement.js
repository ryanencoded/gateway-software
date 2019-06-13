/*
 This is the main library that handles all measurement logic
 including measure management, creation, persistency, and formating
*/

import EventEmitter from "events"
import loki from 'lokijs'

class Measurement extends EventEmitter {
  constructor(config) {
    super()
    //Set the config
    this.config(config)
    //Create the database
    this.db = new loki('gateway.json', {
      'verbose': true,
      'autoload': true,
      'autoloadCallback': this.initialize.bind(this),
      'autosave': true,
      'autosaveInterval': 1000
    })
  }

  //Sets the config info for the build
  config(config) {
    if (typeof config !== "object" || Object.keys(config).length === 0) {
      this.emit('error', {
        name: 'InvalidConfig',
        message: 'A config was not provided to measurement library'
      })
    }

    if (!config.asset || typeof config.asset !== 'string') {
      this.emit('error', {
        name: 'InvalidConfig',
        message: 'No asset artifact provided in measurement config or not a string'
      })
    }

    //Add config info to this.config
    this.config = {}
    Object.assign(this.config, config)
  }

  initialize() {
    this.measurements = this.db.getCollection("measurements")
    if (this.measurements === null) {
      //Add the collection
      this.measurements = this.db.addCollection('measurements', {
        'unique': ['artifact'],
        'disableMeta': true
      })
    }

    this.measurements.on('insert', () => this.refresh())
    this.measurements.on('update', () => this.refresh())
  }

  //Clears all the data from measurements
  clear() {
    this.measurements.clear({
      'removeIndices': true
    })
  }

  //Refreshes the measurements and emits them back out
  refresh() {
    const measurements = this.measurements.find()
    this.emit('refresh', measurements)
    return measurements
  }

  //Builds a telemetry set
  build() {
    let set = {
      "asset": this.config.asset,
      "collectedAt": Date.now()
    }

    const measurements = this.measurements.where(function(item) {
      return item.reading !== null && typeof item.reading !== 'undefined'
    })

    if (!measurements && measurement.length === 0) {
      this.emit('error', {
        name: 'InvalidData',
        message: 'There are no measurements available to build'
      })

      return measurements
    }

    for (const measurement of measurements) {
      set[measurement.artifact] = measurement
    }

    return set
  }

  //Creates a new measurement in the database
  create(name, source, method, scope) {
    if (name == null || typeof name !== 'string') {
      this.emit('error', {
        name: 'IllegalArgument',
        message: 'The name for the measurement was not provided or is not a string'
      })
      return name
    }

    if (source == null || typeof source !== 'number' && typeof source !== 'string') {
      this.emit('error', {
        name: 'IllegalArgument',
        message: 'The source for the measurement was not provided or is not a string|number'
      })
      return source
    }

    if (method == null || typeof method !== 'function') {
      this.emit('error', {
        name: 'IllegalArgument',
        message: 'The method for the measurement was not provided or is not a function'
      })
      return method
    }

    if (scope == null || typeof scope !== 'string') {
      this.emit('error', {
        name: 'IllegalArgument',
        message: 'The scope for the measurement was not provided or is not a string'
      })
      return scope
    }

    const artifact = name.replace(/\W/g, '_').toLowerCase()

    try {
      //Look for record in dataset and update if found
      const record = this.measurements.findOne({
        '$and': [{
          'artifact' : {
            '$eq': artifact
          }
        },{
          'scope' : {
            '$eq': scope
          }
        }]
      })

      record.source = source
      record.method = method
      record.scope = scope
      record.createdAt = Date.now()

      this.measurements.update(record)

      return record
    } catch (err) {
      try {
        //Insert the record
        const record = this.measurements.insert({
          "artifact": artifact,
          "source": source,
          "method": method,
          "scope": scope,
          "createdAt": Date.now()
        })

        return record
      }catch(err){
        this.emit('error', {
          name: 'OperationFailed',
          message: 'The create measurement function failed to insert',
          meta: err
        })

        return err
      }
    }
  }

  //Records the measurement data on a given artifact
  record(artifact, reading, scope) {
    if (artifact == null || typeof artifact !== 'string') {
      this.emit('error', {
        name: 'IllegalArgument',
        message: 'The artifact for the measurement was not provided or is not a string'
      })
      return artifact
    }

    if (reading == null || typeof reading === 'undefined') {
      this.emit('error', {
        name: 'IllegalArgument',
        message: 'The reading for the measurement was not provided or is undefined'
      })
      return reading
    }

    if (scope == null || typeof artifact !== 'string') {
      this.emit('error', {
        name: 'IllegalArgument',
        message: 'The scope for the measurement was not provided or is not a string'
      })
      return scope
    }

    try {
      const data = this.measurements.findAndUpdate({
        '$and': [{
          'artifact' : {
            '$eq': artifact
          }
        },{
          'scope' : {
            '$eq': scope
          }
        }]
      }, (obj) => {
        obj.reading = reading
        obj.measuredAt = Date.now()
      })

      return data
    } catch (err) {
      this.emit('error', {
        name: 'OperationFailed',
        message: 'The record measurement function failed to update',
        meta: err
      })

      return err
    }
  }



}

export default Measurement
