var assert = require('assert'),
nock      = require('nock'),
http = require('http'),
fs = require('fs');

describe('datafeedreader', function() {

	var datafeedReader;
	var httpmock;
	
	before(function() {
		datafeedReader = require('../lib/datafeedreader').datafeedreader;
	});
	
	beforeEach(function() {
		httpmock = nock("http://someurl.com").get('/').reply(200, fs.readFileSync('./test/testdata/vatsim-data.txt', { encoding: 'ascii' }))
	});

	describe('readDatafeed', function() {
		it("should parse and return general data", function(done) {
			datafeedReader.readDatafeed('http://someurl.com', function(err, data) {
				assert.equal(data.general.version, 8);
				assert.equal(data.general.reload, 2);
				assert.equal(data.general.update, 20150518211752);
				assert.equal(data.general.atisallowmin, 5);
				assert.equal(data.general.connectedclients, 424);

				done(err);
			});
		});
		
		it("should parse and return pilot data", function(done) {
			datafeedReader.readDatafeed('http://someurl.com', function(err, data) {

				// AA77TT:1141545:Don Emerson KAUS:PILOT::38.99368:-103.41717:33648:440:H/J41/F:450:MTPP:40000:KDEN:USA-E:100:1:2200:::5:I:1645:0:5:30:8:0:: /v/:MTPP MEDON UA315 JOSES Y586 FORST Y589 JUNUR BR49V DHP J85 INPIN J91 CTY J151 VUZ J14 LIT J14 IRW J21 ICT J28 GCK QUAIL7:0:0:0:0:::20150518163124:290:30.323:1026:
				assert.equal(data.clients.length, 424);
				var expectedpilot = {        				
						callsign: 'AA77TT',
						CID: '1141545',
						realname: 'Don Emerson KAUS',
						clienttype: 'PILOT',
						frequency: null,
						latitude: 38.99368,
						longitude: -103.41717,
						altitude: 33648,
						groundspeed: 440,
						planned_aircraft: 'H/J41/F',
						planned_depairport: 'MTPP',
						planned_altitude: 40000, 
						planned_destairport: 'KDEN', 
						rating: 1,
						facilitytype: null,
						planned_flighttype: 'I', 
						planned_altairport: null, 
						planned_remarks: ' /v/', 
						planned_route: 'MTPP MEDON UA315 JOSES Y586 FORST Y589 JUNUR BR49V DHP J85 INPIN J91 CTY J151 VUZ J14 LIT J14 IRW J21 ICT J28 GCK QUAIL7', 
						atis_message: null, 
						time_logon: '20150518163124',
						heading: 290};

				assert.deepEqual(data.clients[1], expectedpilot);

				done(err);
			});
		});
		
		it("should parse and return atc data", function(done) {
			datafeedReader.readDatafeed('http://someurl.com', function(err, data) {

				// line 213: EDDT_TWR:1306829:Christoph Stadtmueller:ATC:124.520:52.56000:13.28833:0:::0::::EUROPE-CC:100:2::4:40::::::::::::::::$ voice1.vacc-sag.org/eddt_twr^�TEGEL TOWER^�Monitor ATIS on 125.900:20150518210512:20150518180255::::
				assert.equal(data.clients.length, 424);
				var expectedatc = {        				
						callsign: 'EDDT_TWR',
						CID: '1306829',
						realname: 'Christoph Stadtmueller',
						clienttype: 'ATC',
						frequency: '124.520',
						latitude: 52.56000,
						longitude: 13.28833,
						altitude: 0,
						groundspeed: null,
						planned_aircraft: null,
						planned_depairport: null,
						planned_altitude: null, 
						planned_destairport: null, 
						rating: 2,
						facilitytype: 4,
						planned_flighttype: null, 
						planned_altairport: null, 
						planned_remarks: null, 
						planned_route: null, 
						atis_message: "$ voice1.vacc-sag.org/eddt_twr^'TEGEL TOWER^'Monitor ATIS on 125.900", 
						time_logon: '20150518180255',
						heading: null};

				assert.deepEqual(data.clients[159], expectedatc);

				
				done(err);
			});
		});
	});	// describe
});
