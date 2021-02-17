const dgram = require("dgram");
const Parser = require('@signalk/nmea0183-signalk');

module.exports = function (app) {
  const plugin = {}
  plugin.id = 'IEC61162-450-NMEA0183-client-plugin'
  plugin.name = 'IEC61162-450 to NMEA0183 client'
  plugin.description = plugin.name
  const setStatus = app.setPluginStatus || app.setProviderStatus;

  let numberMulticast = null;
  let socketMulticast = [];
  let socketUdp = [];
  const parser = new Parser()

  plugin.start = function (options) {
    numberMulticast = Object.keys(options.multicast).length;
    app.debug(`Number of configs: ${numberMulticast}`)
    app.debug(options.interfaceIP);
    let multicast;
    let multicastCounter = 0;

    if(options.sendAddress && options.sendPort) {
      socketUdp = dgram.createSocket({ type: "udp4", reuseAddr: true });
    }

    for (i = 0; i < numberMulticast; i++) {
      multicast = options.multicast[i];
      socketMulticast[i] = dgram.createSocket({ type: "udp4", reuseAddr: true });
      socketMulticast[i].bind(multicast.multicastPort, () => {
        socketMulticast[k].addMembership(options.multicast[k].multicastAddress);
        app.debug(options.multicast[k].multicastAddress);
        app.debug(options.multicast[k].multicastPort);
        app.debug(options.interfaceIP);        
        multicastCounter = multicastCounter + 1;
      });

      if(socketMulticast[i]) {
        socketMulticast[i].on("message", function(message) {
          message = message.toString('utf8');
          app.debug(message);
          //console.log(JSON.stringify(message, null, 2)); //For debugging JSON
          nmeaParser(message);
          if(socketUdp) {
            udpSend(message,options.sendAddress,options.sendPort);
          }
          if(options.sendNmeaOut) {
            nmeaOut(message,options.sendNmeaOut)
          }
        });
      }
    }
  }
  
  function sendMessage(message,host,port,i) {
    udpSend(message,host,port,i);
  }

  function udpSend(message,host,port) {
    socketUdp.send(message,port,host,function(error){
      if(error){
        socketUdp.close();
      }
    });
  }
  
  function nmeaOut(message,sendNmeaOut) {
    app.emit(sendNmeaOut, message.replace(/\r?\n|\r/, " "));
  }

  function nmeaParser(message) {
    try {
        const delta = parser.parse(message.trim())      
        if (delta !== null) {
          app.handleMessage(plugin.id,delta);
        }
    }
    catch (e) {
        console.error(`[error] ${e.message}`)
    }
  }

  plugin.stop = function () {
    for (i = 0; i < numberMulticast; i++) {
      if(socketMulticast[i]) {
        socketMulticast[i].close();
        socketMulticast[i] = null;
      }
      if(socketUdp) {
        socketUdp.close();
        socketUdp = null;
      }
    }
  }

  plugin.schema = {
    type: "object",
    properties: {
      interfaceIP: {
        type: 'string',  
        title: 'LAN IP address connected to IEC61162-450 network. Internet connection via IEC61162-460 secure gateway',
        default: '192.168.0.x'
      },
      sendNmeaOut: {
        type: 'string',
        title: 'Send nmea0183 out',
        description: 'Received data is forwarded to address. E.g. localhost.',
        default: 'nmea0183out'
      },
      sendAddress: {
        type: 'string',
        title: 'Output address',
        description: 'Received data is forwarded to address. E.g. localhost.',
        default: 'localhost'
      },
      sendPort: {
        type: 'number',
        title: 'Output port',
        description: 'Output port for UDP data. E.g. multicast data from port 60001 forwarded to localhost 6001',
        default: 6000
      },
      multicast: {
        type: "array",
        title: "IEC61162-450 client",
        description: 'Multicast receiver for IEC61162-450 UDP data and proxy',
        items: {
          type: "object",
          required: [],
          properties: {
            multicastAddress: {
              type: 'string',
              title: 'Multicast address to listen',
              description: 'The normally used range in 239.192.0.1-8, full range in 1-64.',
              default: '239.192.0.x'
            },
            multicastPort: {
              type: 'number',
              title: 'Port to listen',
              description: 'The normal used range in 60001-60008 for addresses mentioned above.',
              default: 60001
            }
          }
        }
      }
    }
  }

  return plugin
}
