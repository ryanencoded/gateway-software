import fs from 'fs'
import Telemetry from './core/Telemetry'
import Asset from './core/Asset'
import Measurement from './core/Measurement'
import Network from "./core/Network"

//config file to use, expected at the root of build file
const config = JSON.parse(fs.readFileSync("./config.json"))
//Initialize the telemetry software
const telemetry = new Telemetry(config.telemetry)
// Initialize the asset software
const asset = new Asset(config.device)
//Initialize the network software
const network = new Network()

/* Network Events */
//Listen for measurement events from network so we save them
network.on('discover', (name, source, method) => telemetry.create(name, source, method, 'network'))
//Listen for record events from network so we update the record
network.on('record', (name, reading) => telemetry.record(name, reading, 'network'))
//Listen for error events from asset
network.on('error', (err) => console.error('NETWORK ERROR: ', JSON.stringify(err)))

/* Asset Events */
//Listen for measurement events from asset so we save them
asset.on('discover', (name, source, method) => telemetry.create(name, source, method, 'asset'))
//Listen for record events from asset so we update the record
asset.on('record', (name, reading) => telemetry.record(name, reading, 'asset'))
//Refresh the telemetry data
asset.on('refresh', () => telemetry.refresh())
//Listen for error events from asset
asset.on('error', (err) => console.error('ASSET ERROR: ', JSON.stringify(err)))

/* Telemetry Events */
//Listen for connection event from telemetry
telemetry.on('connect', () => {
  asset.discover()
  network.discover()
})
//Listen for refresh to update list
telemetry.on('refresh', (measurements) => {
    asset.refresh(measurements)
    network.refresh(measurements)
})
//Listen for upload event from telemetry
telemetry.on('upload', (set) => console.log('Uploaded the telemetry data', JSON.stringify(set)))
//Listen for error events from telemetry
telemetry.on('error', (err) => console.error('TELEMETRY ERROR: ', JSON.stringify(err)))
