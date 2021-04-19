const dgram = require('dgram');
const Parser = require('@signalk/nmea0183-signalk');

module.exports = function (app) {
  const plugin = {};
  plugin.id = 'iec61162-450-nmea0183-client-plugin';
  plugin.name = 'IEC61162-450 to NMEA0183 client';
  plugin.description = plugin.name;
  // const setStatus = app.setPluginStatus || app.setProviderStatus; // Not used yet

  let numberMulticast = null;
  let socketMulticast = [];
  let socketUdp = [];
  const parser = new Parser();
  let multicast = [];

  plugin.start = function (options) {
    numberMulticast = Object.keys(options.multicast);
    app.debug(`Number of configs: ${numberMulticast}`);
    let counter = 0;

    if (options.sendAddress && options.sendPort) {
      socketUdp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    }

    numberMulticast.forEach(items => {
      multicast = options.multicast[items];
      socketMulticast[items] = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      socketMulticast[items].bind(multicast.multicastPort, () => {
        socketMulticast[counter].addMembership(options.multicast[counter].multicastAddress);
        app.debug(`Multicast[${counter}] IP: ${options.multicast[counter].multicastAddress}`);
        app.debug(`Multicast[${counter}] Port: ${options.multicast[counter].multicastPort}`);
        app.debug(`Multicast[${counter}] Interface: ${options.interfaceIP}`);
        counter += 1;
      });

      socketMulticast[items].on('message', (message) => {
        message = message.toString('utf8');
        if (options.removeUdPbC) {
          message = message.replace('UdPbC\u0000', '');
        }
        app.debug(message);
        // console.log(JSON.stringify(message, null, 2)); //For debugging JSON
        if (socketUdp) {
          udpSend(message, options.sendAddress, options.sendPort);
        }
        if (options.sendNmeaOut) {
          nmeaOut(message, options.sendNmeaOut);
        }
        message = message.replace('UdPbC\u0000', '');
        nmeaParser(message);
      });     
    })
  };

  function udpSend(message, host, port) {
    socketUdp.send(message, port, host, (error) => {
      if (error) {
        socketUdp.close();
      }
    });
  }

  function nmeaOut(message, sendNmeaOut) {
    app.emit(sendNmeaOut, message.replace(/\r?\n|\r/, ' '));
  }

  function nmeaParser(message) {
    try {
      const delta = parser.parse(message.trim());
      if (delta !== null) {
        app.handleMessage(plugin.id, delta);
      }
    } catch (e) {
      // console.log(JSON.stringify(message, null, 2));
      console.error(`${plugin.id}: ${e.message}`);
    }
  }

  plugin.stop = function () {
    if (numberMulticast) {
      numberMulticast.forEach(items => {
        if (socketMulticast[items]) {
          socketMulticast[items].close();
          app.debug(`Multicast socket ${items} closed`)
          socketMulticast[items] = null;
        }
      })
      numberMulticast = null;
      if (socketUdp) {
        socketUdp.close();
        app.debug("UDP socket closed")
        socketUdp = null;
      }
    }
  };

  plugin.schema = {
    type: 'object',
    properties: {
      interfaceIP: {
        type: 'string',
        title: 'LAN IP address connected to IEC61162-450 network. Internet connection via IEC61162-460 secure gateway',
        default: '192.168.0.x',
      },
      removeUdPbC: {
        type: 'boolean',
        title: 'Remove "UdPbC" prefix from the strings',
        default: true,
      },
      sendNmeaOut: {
        type: 'string',
        title: 'Send nmea0183 out',
        description: 'Received data is forwarded to address. E.g. localhost.',
        default: 'nmea0183out',
      },
      sendAddress: {
        type: 'string',
        title: 'Output address',
        description: 'Received data is forwarded to address. E.g. localhost.',
        default: 'localhost',
      },
      sendPort: {
        type: 'number',
        title: 'Output port',
        description: 'Output port for UDP data. E.g. multicast data from port 60001 forwarded to localhost 6001',
        default: 6000,
      },
      multicast: {
        type: 'array',
        title: 'IEC61162-450 client',
        description: 'Multicast receiver for IEC61162-450 UDP data and proxy',
        items: {
          type: 'object',
          required: [],
          properties: {
            multicastAddress: {
              type: 'string',
              title: 'Multicast address to listen',
              description: 'The normally used range in 239.192.0.1-8, full range in 1-64.',
              default: '239.192.0.x',
            },
            multicastPort: {
              type: 'number',
              title: 'Port to listen',
              description: 'The normal used range in 60001-60008 for addresses mentioned above.',
              default: 60001,
            },
          },
        },
      },
    },
  };

  return plugin;
};
