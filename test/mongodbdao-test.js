var assert = require('assert'),
	nock = require('nock'),
	http = require('http'),
	fs = require('fs'),
	datafeedReader = require('../lib/datafeedreader.js').datafeedreader,
	mongoClient = require('mongodb').MongoClient;

describe('mongodbdao', function() {

	before(function() {
		mongodbdao = require('../lib/mongodbdao').mongodbdao;
	});
	
	beforeEach(function() {
		httpmock = nock("http://someurl.com").get('/').reply(200, fs.readFileSync('./test/testdata/vatsim-data.txt', { encoding: 'ascii' }))
	});

	after(function(done) {
		mongodbdao.deleteAllOnlineClients(function(err) { 
			mongodbdao.deleteClientQueue(function(err) {
				done(); 
			});
		});
	});
	
	describe('insertOnlineClients', function() {
		
		var checkInsertedClients = function(done) {
			mongoClient.connect(mongodbdao._url, function(err, db) {
				
				db.collection(mongodbdao._collection_onlineclients).find().toArray(function(err, docs) {
					db.close();
					assert.equal(docs.length, 424);
					done();
				});
			});
		};
		
		it("should persist clients", function(done) {
			datafeedReader.readDatafeed('http://someurl.com', function(err, data) {
				assert.equal(data.clients.length, 424);
				mongodbdao.insertOnlineClients(data.clients, function(err, result) {
					assert(err == null);
					checkInsertedClients(done);
				});
			});
		});
	});	
	
	describe('getOnlineClients', function() {
		
		var checkReadClients = function(result, done) { 
			assert.equal(result[1].CID, "1141545");
			done();
		};
		
		it("should read all clients", function(done) {
			datafeedReader.readDatafeed('http://someurl.com', function(err, data) {
				assert.equal(data.clients.length, 424);
				mongodbdao.insertOnlineClients(data.clients, function(err, result) {
					mongodbdao.getOnlineClients(function(err, result) {
						assert(err == null);
						checkReadClients(result, done);
					});
				});
			});
		});
	});	
	
	describe('queueClientsForProcessing', function() {
		
		var checkQueuedClients = function(expected, done) {
			mongoClient.connect(mongodbdao._url, function(err, db) {
				
				db.collection(mongodbdao._collection_clientqueue).find().toArray(function(err, docs) {
					db.close();
					assert.equal(docs.length, expected);
					assert.equal(docs[0].timestamp.getTime(),  new Date(2015, 4, 20, 8, 37, 0).getTime());
					assert.equal(docs[0].clients.length, 424);
					done();
				});
			});
		};
		
		it("should queue clients", function(done) {
			datafeedReader.readDatafeed('http://someurl.com', function(err, data) {
				assert.equal(data.clients.length, 424);
				mongodbdao.queueClientsForProcessing(new Date(2015, 4, 20, 8, 37, 0), data.clients, function(err) {
					assert(err == null);
					checkQueuedClients(1, done);
				});
			});
		});
		
		it("should not queue clients from same data batch", function(done) {
			datafeedReader.readDatafeed('http://someurl.com', function(err, data) {
				assert.equal(data.clients.length, 424);
				mongodbdao.queueClientsForProcessing(new Date(2015, 4, 20, 8, 37, 0), data.clients, function(err) {
					assert(err == null);
					checkQueuedClients(1, done);
				});
			});
		});
	});	
	
	describe('getOldestFromClientQueue', function() {
		
		it("should return null when queue is empty", function(done) {
			
			mongodbdao.getOldestFromClientQueue(function(err, data) {
					assert(err == null);
					assert(data == null);
					done();
			});
		});
	
		it("should find oldest client batch", function(done) {
			datafeedReader.readDatafeed('http://someurl.com', function(err, data) {
				assert.equal(data.clients.length, 424);
				mongodbdao.queueClientsForProcessing(new Date(2015, 4, 20, 8, 37, 0), data.clients, function(err) {
					assert(err == null);
					mongodbdao.queueClientsForProcessing(new Date(2015, 4, 20, 8, 37, 1), data.clients, function(err) {
						assert(err == null);
						mongodbdao.getOldestFromClientQueue(function(err, data) {
								assert(err == null);
								assert.equal(data.timestamp.getTime(), new Date(2015, 4, 20, 8, 37, 0).getTime());
								done();
							});
						});
					});
				});
			});
		});
		
	
	

});