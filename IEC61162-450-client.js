const PORT = 60004;
const HOST = '192.168.0.32';
const MULTICAST_ADDR = '239.192.0.4';

const dgram = require("dgram");
const process = require("process");

const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

socket.bind(PORT);

socket.on("listening", function() {
    socket.addMembership(MULTICAST_ADDR, HOST);
    //setInterval(sendMessage, 2500);
    const address = socket.address();
    console.log(
        `UDP socket listening on ${address.address}:${address.port} pid: ${
            process.pid
        }`
    );
});

function sendMessage() {
    const message = Buffer.from(`Message from process ${process.pid}`);
    socket.send(message, 0, message.length, PORT, MULTICAST_ADDR, function() {
        console.info(`Sending message "${message}"`);
    });
}

socket.on("message", function(message, rinfo) {
    console.info(`
From: ${rinfo.address}:${rinfo.port}, To ${MULTICAST_ADDR}:${PORT}, Host: ${HOST}
Message: ${message}`);
});
