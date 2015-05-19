var assert = require('assert'),
	nock = require('nock'),
	http = require('http'),
	fs = require('fs'),
	datafeedReader = require('../lib/datafeedreader.js'),
	mongoClient = require('mongodb').MongoClient;

describe('mongodbdao', function() {

	before(function() {
		mongodbdao = require('../lib/mongodbdao');
	});
	
	beforeEach(function() {
		httpmock = nock("http://someurl.com").get('/').reply(200, fs.readFileSync('./test/testdata/vatsim-data.txt', { encoding: 'ascii' }))
	});

	afterEach(function(done) {
		mongodbdao.deleteAllOnlineClients(function(err, result) { done(); });
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
			console.log("result", result[1]);
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

});