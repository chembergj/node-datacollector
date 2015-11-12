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
	
	
	
	getOnlineClients: function(callback) {
		mongoClient.connect(mongodbdao._url, function(err, db) {
			if(err != null) {
				callback(err, null);
			}
			else {
				db.collection(mongodbdao._collection_onlineclients).find().toArray(function(err, docs) {
					db.close();
					callback(err, docs);
				});
			}
		});
	},
	
	
	
	deleteAllOnlineClients: function(callback) {
		mongoClient.connect(mongodbdao._url, function(err, db) {
			if(err != null) {
				callback(err);
			}
			else {
				db.collection(mongodbdao._collection_onlineclients).drop(function(err, result) {
					db.close();
					callback(err);
				});
			}
		});
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
						db.close();
						callback(err);
					}
					else {
						console.log("QUEING");
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
	
	getOldestFromClientQueue: function(callback) {
		mongoClient.connect(mongodbdao._url, function(err, db) {
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
		mongoClient.connect(mongodbdao._url, function(err, db) {
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

exports.mongodbdao = mongodbdao;

		