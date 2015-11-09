var http = require('http'), 
	path = require('path'),
	serverlistreader = require('./lib/serverlistreader.js').serverlistreader,
	datafeedreader = require('./lib/datafeedreader.js').datafeedreader,
	mongodbdao = require('./lib/mongodbdao').getmongodbdao(''),
	winston = require('winston'),

vatstatconfig = {
	serverlist: [],	// List of available datafeed servers from http://status.vatsim.net
	
	getRandomServer: function() {
		return vatstatconfig.serverlist[Math.floor((Math.random() * vatstatconfig.serverlist.length))];
	}
};

winston.loggers.add('stdlog', {
	file: {
		filename: 'metrics.log'
	},
	console: {
		colorize: true
	}
});

winston.loggers.add('metricslog', {
	file: {
		level: 'metrics',
		filename: 'metrics.log'
	},
	console: {
		level: 'metrics',
		colorize: true
	}
});


winston.add(winston.transports.File, { name: 'errlog', filename: 'datacollector.log' });


var refreshAndQueueOnlineClients = function(data, callback) {

	
	mongodbdao.deleteAllOnlineClients(function(err) {
	var date = new Date(
			data.general.update.substr(0, 4) + '-' +
			data.general.update.substr(4, 2) + '-' +
			data.general.update.substr(6, 2) + 'T' +
			data.general.update.substr(8, 2) + ':' +
			data.general.update.substr(10, 2) + ':' +
			data.general.update.substr(12, 2) + 'Z');
					
		mongodbdao.insertAndQueueOnlineClients(date, data.clients, function(err) {
			callback(err, data);
		});
	});
};

var processOnlineClientBatch = function(callback) {
	var chosenServer = vatstatconfig.getRandomServer();
	winston.info('Loading data from ' + chosenServer);
	
	datafeedreader.readDatafeed(chosenServer, function(err, data) {
		if(err != null) {
			callback(err);
		}
		else {
			refreshAndQueueOnlineClients(data, callback);
		}
	});
}

// Setup metrics logging

var metricsIntervalObj = setInterval(mongodbdao.logmetrics, 10000, function(err, data) {
});

serverlistreader.readServerList('http://status.vatsim.net', function(err, serverlist) {
	if(err != null) {
		winston.error('Failed to read serverlist: ', { error:  err });
	}
	else {
		vatstatconfig.serverlist = serverlist;
		winston.info('Read ' + serverlist.length + ' dataservers');
		
		processOnlineClientBatch(function(err, data) {
			
			if(err != null) {
				winston.error('Error calling readAndStoreAndQueueOnlineClient: ', { error: err});
			}
			else {
				winston.info('Scheduling data fetch every ' + data.general.reload + ' minutes');
				var intervalObj = setInterval(processOnlineClientBatch, 10000 /*parseInt(data.general.reload)*60000*/, function(err, data) {
					if(err != null) {
						winston.error('Error calling readAndStoreAndQueueOnlineClient: ', { error: err});
					}
				});
				
				http.createServer(function(req, res) {
					res.writeHead(200, {'Content-Type': 'text/plain'});
					res.end('node-datacollector isalive page!');
				}).listen(3001, function(){
					winston.info('node-datacollector listening on port 3001');
				});
			}
		});
	}
});