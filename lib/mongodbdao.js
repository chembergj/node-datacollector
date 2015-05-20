var mongoClient = require('mongodb').MongoClient,
	winston = require('winston'),
	assert = require('assert');
	
var mongodbdao = {
	
	_url: 'mongodb://localhost:27017/vatstats',
	_collection_onlineclients: 'onlineclients',
	_collection_clientqueue: 'clientprocessingqueue',
	
	insertOnlineClients: function(clients, callback) {
			
			mongoClient.connect(mongodbdao._url, function(err, db) {
				if(err != null) {
					callback(err);
				}
				else {
					db.collection(mongodbdao._collection_onlineclients).insertMany(clients, function(err, result) {
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
	
	queueClientsForProcessing: function(timestamp, clients, callback) {
		mongoClient.connect(mongodbdao._url, function(err, db) {
			if(err != null) {
				winston.error('queueClientsForProcessing: error in connect', { error: err});
				callback(err);
			}
			else {
				db.collection(mongodbdao._collection_clientqueue).find({timestamp: timestamp}).toArray(function(err, data) {
					if(data.length > 0) {
						winston.info('Skipping queing of client data since timestamp ' + timestamp + ' is already in queue');
						callback(err);
					}
					else {
						db.collection(mongodbdao._collection_clientqueue).insertOne({ timestamp: timestamp, clients: clients }, function(err, result) {

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
	
	getOnlineClients: function(callback) {
		mongoClient.connect(mongodbdao._url, function(err, db) {
			if(err != null) {
				callback(err, null);
			}
			
			db.collection(mongodbdao._collection_onlineclients).find().toArray(function(err, docs) {
				db.close();
				callback(err, docs);
			});
		});
	},
	
	// for unit test purposes only
	deleteClientQueue: function(callback) {
		mongoClient.connect(mongodbdao._url, function(err, db) {
			if(err != null) {
				callback(err, null);
			}
			
			db.collection(mongodbdao._collection_clientqueue).drop(function(err, result) {
				db.close();
				callback(err);
			});
		});
	},
	
	deleteAllOnlineClients: function(callback) {
		mongoClient.connect(mongodbdao._url, function(err, db) {
			if(err != null) {
				callback(err);
			}
			
			db.collection(mongodbdao._collection_onlineclients).drop(function(err, result) {
				db.close();
				callback(err);
			});
		});
	}
};

exports.mongodbdao = mongodbdao;