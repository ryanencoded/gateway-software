# Gateway Software
This project is a psuedo version of a gateway software I wrote to collect IoT telemetry data and send the data back to AWS IoT. For proprietary reasons, move of the code has been removed to show the minimal amount needed to demonstrate the concept.

##Structure
The psuedo directory structure is as follows:

```
gateway-software
│   README.md
│   package.json    
│
└───src
│   │   index.js
│   │
│   |───core
│   |   │   Asset.js
│   |   │   Device.js
│   |   │   Measurement.js
|   |   |   Network.js
|   |   |   Telemetry.js
|   |
|   |___devices (all device specific code)
│   
└───dist (npm run build)
    │   gateway-software.js
```

**NOTE: The above structure is a psuedo version of what I would normally write in a readme structure.**

#Process/Scripts
This is where I would tell other developers how to work with the software at the script level. I.e.

``` npm start ``` - Installs dependencies and opens index.js in node

``` npm run build ``` - Build the src for production and places code in dist folder

...Any other relevant commands


#Additional Information
This is where I put anything else I want the other developers to know. I would put any historical information, relevant links, or really just anything that a developer need to know to succeed.

#Company Specific Information
This is where I place anything else that a company wants me to include in the readme.


#Acknowledgement
* Ryan Thompson - Lead developer
* Other Member - Role they played
