
var net = require('net');

export default class {
	constructor(port) {
		this.server = net.createServer(function (socket) {
			socket.write('Echo server\r\n');
			socket.pipe(socket);
			socket.on("data", function (data) {
				console.log('Received: ' + data);
				//server.destroy(); // kill client after server's response
			});
		});
		this.server.listen(port);
	}
}