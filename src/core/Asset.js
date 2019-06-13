/*
 This is the Asset library that handles asset logic
 such as setting the asset to the right device. This can
 be thought of as the Asset Manager
*/

/* Devices - Some removed for proprietary purposes */
import LiquidLevel from '../devices/liquid-level'
import Generator from '../devices/generator'

class Asset {
  constructor(config){
    const devices = {
      'liquid-level': (config) => {
        return new LiquidLevel(config)
      },
      'generator': (config) => {
        return new Generator(config)
      },
      default: () => {
        throw (config.device+' device is not supported by the system.')
      }
    }

    return devices[config.device](config)
  }
}

export default Asset
