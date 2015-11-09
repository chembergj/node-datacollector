var mongoClient = require('mongodb').MongoClient,
	winston = require('winston'),
	assert = require('assert'),
	t = require('exectimer');

tick_insertOnlineClients_insertMany = new t.Tick("insertOnlineClients_insertMany");

var 
	tick_getOnlineClients_find = new t.Tick("getOnlineClients_find"),
	tick_deleteAllOnlineClients_drop = new t.Tick("deleteAllOnlineClients_drop"),
	tick_queueClientsForProcessing_find = new t.Tick("queueClientsForProcessing_find"),
	tick_queueClientsForProcessing_insertOne = new t.Tick("queueClientsForProcessing_insertOne");

var metricslogger = new (winston.Logger)({
  transports: [
       new (winston.transports.Console)({ level: 'metrics' }),
       new (winston.transports.File)({
    	   name: 'metrics-file',
    	   filename: 'metrics.log',
    	   level: 'info'
	       })
       ]
});

var mongodbdao = {
	
	_collection_onlineclients: 'onlineclients',
	_collection_clientqueue: 'clientprocessingqueue',
	dbpostfix: '',
	
	getdburl: function() {
		return 'mongodb://localhost:27017/vatstats' + mongodbdao.dbpostfix;  
	},
	
	logmetrics: function() {
		
		if(typeof t.timers.insertOnlineClients_insertMany !== 'undefined') {
			console.log("LOG: ", ' count=' + t.timers.insertOnlineClients_insertMany.count());
			metricslogger.info('func=insertOnlineClients_insertMany' +
				' count=' + t.timers.insertOnlineClients_insertMany.count() +
				' min=' + t.timers.insertOnlineClients_insertMany.min() +
				' mean=' + t.timers.insertOnlineClients_insertMany.mean() +
				' max=' + t.timers.insertOnlineClients_insertMany.max());
		}
		/*
		winston.log('metrics', 'func=tick_getOnlineClients_find' +
				' count=' + t.timers.tick_getOnlineClients_find.count() +
				' min=' + t.timers.tick_getOnlineClients_find.min() +
				'mean=' + t.timers.tick_getOnlineClients_find.mean() +
				'max=' + t.timers.tick_getOnlineClients_find.max());
		winston.log('metrics', 'func=tick_deleteAllOnlineClients_drop' +
				' count=' + mongodbdao.tick_deleteAllOnlineClients_drop.count() +
				' min=' + mongodbdao.tick_deleteAllOnlineClients_drop.min() +
				'mean=' + mongodbdao.tick_deleteAllOnlineClients_drop.mean() +
				'max=' + mongodbdao.tick_deleteAllOnlineClients_drop.max());
		winston.log('metrics', 'func=tick_queueClientsForProcessing_find' +
				' count=' + mongodbdao.tick_queueClientsForProcessing_find.count() +
				' min=' + mongodbdao.tick_queueClientsForProcessing_find.min() +
				'mean=' + mongodbdao.tick_queueClientsForProcessing_find.mean() +
				'max=' + mongodbdao.tick_queueClientsForProcessing_find.max());
		winston.log('metrics', 'func=tick_queueClientsForProcessing_insertOne' +
				' count=' + mongodbdao.tick_queueClientsForProcessing_insertOne.count() +
				' min=' + mongodbdao.tick_queueClientsForProcessing_insertOne.min() +
				'mean=' + mongodbdao.tick_queueClientsForProcessing_insertOne.mean() +
				'max=' + mongodbdao.tick_queueClientsForProcessing_insertOne.max());*/
	},
	
	insertOnlineClients: function(clients, callback) {
			
			mongoClient.connect(mongodbdao.getdburl(), function(err, db) {
				if(err != null) {
					console.log("ERR: ", err);
					callback(err);
				}
				else {
					tick_insertOnlineClients_insertMany.start();
					
					db.collection(mongodbdao._collection_onlineclients).insertMany(clients, function(err, result) {
						tick_insertOnlineClients_insertMany.stop();
						db.close();
						callback(err);
					});
				}
			});
		},
		
	insertAndQueueOnlineClients: function(timestamp, clients, callback) {
		
		mongodbdao.insertOnlineClients(clients, function(err) {
			if(err == null) {
				mongodbdao.queueClientsForProcessing(timestamp, clients, function(err) {
					callback(err);
				});
			}
			else {
				callback(err);
			}
		})
	},
	
	
	
	getOnlineClients: function(callback) {
		mongoClient.connect(mongodbdao.getdburl(), function(err, db) {
			if(err != null) {
				callback(err, null);
			}
			
			mongodbdao.tick_getOnlineClients_find.start();
			
			db.collection(mongodbdao._collection_onlineclients).find().toArray(function(err, docs) {
				mongodbdao.tick_getOnlineClients_find.stop();
				db.close();
				callback(err, docs);
			});
		});
	},
	
	
	
	deleteAllOnlineClients: function(callback) {
		mongoClient.connect(mongodbdao.getdburl(), function(err, db) {
			if(err != null) {
				callback(err);
			}
			else {
				tick_deleteAllOnlineClients_drop.start();
				
				db.collection(mongodbdao._collection_onlineclients).drop(function(err, result) {
					tick_deleteAllOnlineClients_drop.stop();
					db.close();
					callback(err);
				});
			}
		});
	},
	
	queueClientsForProcessing: function(timestamp, clients, callback) {
		mongoClient.connect(mongodbdao.getdburl(), function(err, db) {
			if(err != null) {
				winston.error('queueClientsForProcessing: error in connect', { error: err});
				callback(err);
			}
			else {
				tick_queueClientsForProcessing_find.start();

				db.collection(mongodbdao._collection_clientqueue).find({timestamp: timestamp}).toArray(function(err, data) {
					tick_queueClientsForProcessing_find.stop();
					if(data.length > 0) {
						winston.info('Skipping queing of client data since timestamp ' + timestamp + ' is already in queue');
						db.close();
						callback(err);
					}
					else {
						
						tick_queueClientsForProcessing_insertOne.start();

						db.collection(mongodbdao._collection_clientqueue).insertOne({ timestamp: timestamp, clients: clients }, function(err, result) {
							tick_queueClientsForProcessing_insertOne.stop();
							if(err != null) {
								winston.error('queueClientsForProcessing: error in insertOne', { error: err});
							}
							
							db.close();
							callback(err);
						});
					}
				});
			}
		});
	},
	
	getOldestFromClientQueue: function(callback) {
		mongoClient.connect(mongodbdao.getdburl(), function(err, db) {
			if(err != null) {
				callback(err, null);
			}
			else {
				db.collection(mongodbdao._collection_clientqueue).aggregate( [ { $group: { _id: 0, minTimestamp: { $min: "$timestamp" }} } ] ).toArray(function(err, result) {
					var oldestTimestamp = result[0].minTimestamp;
					console.log('OLDEST: ', oldestTimestamp);
					db.collection(mongodbdao._collection_clientqueue).find({ timestamp: oldestTimestamp}).toArray(function(err, result) {
						if(result.length > 0) {
							callback(err, result[0]);
						}
						else {
							callback(err, null);
						}
					});
				});
			}
		});
	},
	
	// for unit test purposes only
	deleteClientQueue: function(callback) {
		mongoClient.connect(mongodbdao.getdburl(), function(err, db) {
			if(err != null) {
				callback(err, null);
			}
			
			db.collection(mongodbdao._collection_clientqueue).drop(function(err, result) {
				db.close();
				callback(err);
			});
		});
	}
};

exports.getmongodbdao = function (dbprefix) {
	mongodbdao.dbprefix = dbprefix;
	return mongodbdao;
}

		