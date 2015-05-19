var http = require('http'), 
	path = require('path'),
	serverlistreader = require('./lib/serverlistreader.js').serverlistreader,
	datafeedreader = require('./lib/datafeedreader.js').datafeedreader,
	mongodbdao = require('./lib/mongodbdao').mongodbdao;

vatstatconfig = {
	serverlist: [],	// List of available datafeed servers from http://status.vatsim.net
	
	getRandomServer: function() {
		return vatstatconfig.serverlist[Math.floor((Math.random() * vatstatconfig.serverlist.length) + 1)];
	}
};

serverlistreader.readServerList('http://status.vatsim.net', function(err, serverlist) {
	if(err != null) {
		console.error('Failed to read serverlist: ', err);
	}
	else {
		vatstatconfig.serverlist = serverlist;
		datafeedreader.readDatafeed(vatstatconfig.getRandomServer(), function(err, data) {
			mongodbdao.insertOnlineClients(data.clients, function(err, result) {
				http.createServer(function(req, res) {
					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end('node-datacollector isalive page!');
				}).listen(3001, function(){
					console.log('Express server listening on port 3001');
				});
			});
		});
	}
});
  


