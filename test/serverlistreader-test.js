var mockery = require('mockery'),
	assert = require('assert'),
	nock      = require('nock'),
	http = require('http'),
	fs = require('fs');


var api = nock("http://status.vatsim.net").get('/').reply(200, fs.readFileSync('./test/testdata/status.vatsim.net.txt', { encoding: 'ascii' }))
describe('serverlistreader', function() {

	var serverListReader;
	
	before(function(done) {
        // mockery.enable(); // Enable mockery at the start of your test suite
        done();
    });

	 beforeEach(function() {
	        // mockery.registerAllowable('../lib/serverlist-reader', true); // Allow our module under test to be loaded normally as well
	        serverListReader = require('../lib/serverlistreader').serverlistreader;
	    });
	 
	 afterEach(function() {
        // mockery.deregisterAll();    // Deregister all Mockery mocks from node's module cache
    });

    after(function() {
        // mockery.disable(); // Disable Mockery after tests are completed
    });
    
    describe('readServerlist', function() {
    	it("should return 6 lines of url's", function(done) {
    		serverListReader.readServerList('http://status.vatsim.net', function(err, data) {
    			assert.equal(data.length, 6);
    			done(err);
    		});
    	});
    });
});
