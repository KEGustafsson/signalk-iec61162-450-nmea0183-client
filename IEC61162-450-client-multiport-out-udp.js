const HOST = '192.168.0.32';

const PORT1 = 60001;
const PORT2 = 60002;
const PORT4 = 60004;
const OUT = 54000;
const COMMON_PORT = 6000;

const MULTICAST_ADDR1 = '239.192.0.1';
const MULTICAST_ADDR2 = '239.192.0.2';
const MULTICAST_ADDR4 = '239.192.0.4';

const dgram = require("dgram");
const process = require("process");

const socket1 = dgram.createSocket({ type: "udp4", reuseAddr: true });
const socket2 = dgram.createSocket({ type: "udp4", reuseAddr: true });
const socket4 = dgram.createSocket({ type: "udp4", reuseAddr: true });
const client = dgram.createSocket('udp4');


socket1.bind(PORT1);
socket2.bind(PORT2);
socket4.bind(PORT4);

function udpSend(message,PORT) {
    client.send(message,(PORT - OUT),'localhost',function(error){
        if(error){
          client.close();
        }
    });
}

function udpSendCommon(message) {
    client.send(message,COMMON_PORT,'localhost',function(error){
        if(error){
          client.close();
        }
    });
}

socket1.on("listening", function() {
    socket1.addMembership(MULTICAST_ADDR1, HOST);
    const address = socket1.address();
    console.log(
        `UDP socket listening on ${address.address}:${address.port} pid: ${
            process.pid
        }`
    );
});

socket1.on("message", function(message, rinfo) {
    console.info(
        `From: ${rinfo.address}:${rinfo.port}, To ${MULTICAST_ADDR1}:${PORT1}, Host: ${HOST}`,'\n',
        `Message: ${message}`
    );
    udpSend(message,PORT1);
    udpSendCommon(message);
});


socket2.on("listening", function() {
    socket2.addMembership(MULTICAST_ADDR2, HOST);
    const address = socket2.address();
    console.log(
        `UDP socket listening on ${address.address}:${address.port} pid: ${
            process.pid
        }`
    );
});

socket2.on("message", function(message, rinfo) {
    console.info(
        `From: ${rinfo.address}:${rinfo.port}, To ${MULTICAST_ADDR2}:${PORT2}, Host: ${HOST}`,'\n',
        `Message: ${message}`
    );
    udpSend(message,PORT2);
    udpSendCommon(message);
});


socket4.on("listening", function() {
    socket4.addMembership(MULTICAST_ADDR4, HOST);
    const address = socket4.address();
    console.log(
        `UDP socket listening on ${address.address}:${address.port} pid: ${
            process.pid
        }`
    );
});

socket4.on("message", function(message, rinfo) {
    console.info(
        `From: ${rinfo.address}:${rinfo.port}, To ${MULTICAST_ADDR4}:${PORT4}, Host: ${HOST}`,'\n',
        `Message: ${message}`
    );
    udpSend(message,PORT4);
    udpSendCommon(message);
});
