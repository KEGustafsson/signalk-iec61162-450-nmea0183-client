const HOST = '192.168.0.32';
const HOSTOUT = 'localhost';


const PORT1 = 60001;
const PORT2 = 60002;
const PORT4 = 60004;
const OUT = 54000;
const COMMON_PORT = 6000;

const MULTICAST_ADDR1 = '239.192.0.1';
const MULTICAST_ADDR2 = '239.192.0.2';
const MULTICAST_ADDR4 = '239.192.0.4';

const dgram = require("dgram");
//const process = require("process");
const Parser = require('@signalk/nmea0183-signalk');
//const udp = require("./lib/udp");
const parser = new Parser()

const socket1 = dgram.createSocket({ type: "udp4", reuseAddr: true });
console.log(JSON.stringify(socket1, null, 2));
const socket2 = dgram.createSocket({ type: "udp4", reuseAddr: true });
const socket4 = dgram.createSocket({ type: "udp4", reuseAddr: true });
const client = dgram.createSocket({ type: "udp4", reuseAddr: true });


socket1.bind(PORT1);
console.log(JSON.stringify(socket1, null, 2));
socket2.bind(PORT2);
socket4.bind(PORT4);

function nmeaParser(message) {
    // let date = new Date();
    // console.log(date.toISOString().replace(/^[^:]*([0-2]\d:[0-5]\d).*$/, "$1"),`${message}`);
    try {
        const delta = parser.parse(message)
        /*
        if (delta !== null) {
            console.log(`[delta] ${JSON.stringify(delta, null, 2)}`)
        }
        */
    }
    catch (e) {
        let date = new Date();
        console.error(date.toISOString().replace(/^[^:]*([0-2]\d:[0-5]\d).*$/, "$1"),`[error] ${e.message}`)
    }
}

function udpSend(message,port,host) {
    client.send(message,port,host,function(error){
        if(error){
          client.close();
        }
    });
}

function send(message,PORT) {
    message = message.toString('utf8');
    nmeaParser(message);
    port = (PORT - OUT);
    host = HOSTOUT;
    udpSend(message,port,host);
    port = COMMON_PORT;
    udpSend(message,port,host);
}

socket1.on("listening", function() {
    socket1.addMembership(MULTICAST_ADDR1, HOST);
    console.log(JSON.stringify(socket1, null, 2));
    const address = socket1.address();
});

socket1.on("message", function(message, rinfo) {
    //console.log(JSON.stringify(message, null, 2));
    send(message,PORT1);
});


socket2.on("listening", function() {
    socket2.addMembership(MULTICAST_ADDR2, HOST);
    const address = socket2.address();
});

socket2.on("message", function(message, rinfo) {
    send(message,PORT2);
});


socket4.on("listening", function() {
    socket4.addMembership(MULTICAST_ADDR4, HOST);
    const address = socket4.address();
});

socket4.on("message", function(message, rinfo) {
    send(message,PORT4);
});
