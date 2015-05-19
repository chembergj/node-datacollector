/*var http = require('http');
http.createServer(function handler(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
}).listen(1337, '127.0.0.1');*/
var serverlistReader = require('./lib/serverlistreader.js');
var datafeedReader = require('./lib/datafeedreader.js');

serverlistReader.readServerList('http://status.vatsim.net/', 
	function(err, serverList) {
		console.log(serverList);
		
		datafeedReader.readDatafeed(serverList[0], function(err, data) {
			console.log('General: ', data.general);
			console.log('Clients: ', data.clients);
		})
	});

 
 