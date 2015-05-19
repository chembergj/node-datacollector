var http = require('http');


var datafeedReader = {
		
		generalData: {},
		clientData: [],
		
		readDatafeed: function(url, callback) {
			var request = http.get(url, function(response) {
				
				var body = '';
				datafeedReader.clientData = [];
				response.setEncoding('utf-8');
				response.on('data', function(data) { 
					body += data; 
				});
				
				response.on('end', function() {
					callback(null, datafeedReader.parseDatafeed(body));
				});
			});
			request.on('error', function(e) { callback(e, null); });
		},
		
		invokeSectionHandler: function(datalines, lineidx) {
			var handlers = { '!GENERAL:': datafeedReader.parseGeneralSection,
			                 '!VOICE SERVERS:': datafeedReader.parseVoiceServers,
			                 '!CLIENTS:': datafeedReader.parseClients,
			                 '!SERVERS:': datafeedReader.parseServers,
			                 '!PREFILE:': datafeedReader.parsePrefiled
			};
			var handler = handlers[datalines[lineidx].substring(0, datalines[lineidx].length)];
			if(handler == undefined) console.log('error while looking for handler for ' + datalines[lineidx].substring(0, datalines[lineidx].length));
			return handler(datalines, lineidx + 1);
		},
		
		parseDatafeed: function(data, lineidx) {
			var datalines = data.split('\n');
			lineidx=0;
			while(lineidx < datalines.length) {
				var line = datalines[lineidx];
				if(line.length == 0 || line.substring(0, 1) == ';' || line.substring(0,1) == '\n') {
					lineidx++;
					continue;
				}
				else {
					lineidx = datafeedReader.invokeSectionHandler(datalines, lineidx);
				}
			}
						
			return { general: datafeedReader.generalData,
					clients: datafeedReader.clientData 
				};
		},

		/*
		 * !GENERAL:
			VERSION = 8
			RELOAD = 2
			UPDATE = 20121001190940
			ATIS ALLOW MIN = 5
			CONNECTED CLIENTS = 661
		 */
		parseGeneralSection: function(datalines, lineidx) {
			var keyPropertyMap = { 'VERSION': 'version',
			             'RELOAD': 'reload',
			             'UPDATE': 'update',
			             'ATIS ALLOW MIN': 'atisallowmin',
			             'CONNECTED CLIENTS': 'connectedclients'
			};
			
			while((datalines[lineidx].substring(0,1) != ';')
				&& (datalines[lineidx].substring(0,1) != '!')) {
					var splittedLine = datalines[lineidx].split('=');
					var key = splittedLine[0].trim();
					var value = splittedLine[1].trim();
					datafeedReader.generalData[keyPropertyMap[key]] = value;
					lineidx++;
				}
			return lineidx;
		},
		
		parseVoiceServers: function(datalines, lineidx) {
			
			while((datalines[lineidx].substring(0,1) != ';')
				&& (datalines[lineidx].substring(0,1) != '!')) {
				// Do something with voice server
				lineidx++;
			}
			
			return lineidx;
		},
		
		parseServers: function(datalines, lineidx) {
			
			while((datalines[lineidx].substring(0,1) != ';')
				&& (datalines[lineidx].substring(0,1) != '!')) {
				// Do something with server
				lineidx++;
			}
			
			return lineidx;
		},
		
		parsePrefiled: function(datalines, lineidx) {
			
			while((datalines[lineidx].substring(0,1) != ';')
				&& (datalines[lineidx].substring(0,1) != '!')) {
				// Do something with server
				lineidx++;
			}
			
			return lineidx;
		},
		
		// ; !CLIENTS section -         callsign:cid:realname:clienttype:frequency:latitude:longitude:altitude:groundspeed:planned_aircraft:planned_tascruise:planned_depairport:planned_altitude:planned_destairport:server:protrevision:rating:transponder:facilitytype:visualrange:planned_revision:planned_flighttype:planned_deptime:planned_actdeptime:planned_hrsenroute:planned_minenroute:planned_hrsfuel:planned_minfuel:planned_altairport:planned_remarks:planned_route:planned_depairport_lat:planned_depairport_lon:planned_destairport_lat:planned_destairport_lon:atis_message:time_last_atis_received:time_logon:heading:QNH_iHg:QNH_Mb:

		parseClient: function(clientString) {

			function parseIntOrNull(val) {
				if(val == null || val.length == 0) return null;
				else return parseInt(val);
			};
			
			function stringOrNull(val) {
				if(val == null || val.length == 0) return null;
				else return val;
			};
			
			var clientStrings = clientString.split(':');
			return {
				callsign: stringOrNull(clientStrings[0]),
				CID: stringOrNull(clientStrings[1]),
				realname: stringOrNull(clientStrings[2]),
				clienttype: stringOrNull(clientStrings[3]),
				frequency: stringOrNull(clientStrings[4]),
				latitude: parseFloat(clientStrings[5]),
				longitude: parseFloat(clientStrings[6]),
				altitude: parseIntOrNull(clientStrings[7]),
				groundspeed: parseIntOrNull(clientStrings[8]),
				planned_aircraft: stringOrNull(clientStrings[9]),
				planned_depairport: stringOrNull(clientStrings[11]),
				planned_altitude: parseIntOrNull(clientStrings[12]), 
				planned_destairport: stringOrNull(clientStrings[13]), 
				rating: parseInt(clientStrings[16]),
				facilitytype: parseIntOrNull(clientStrings[18]),
				planned_flighttype: stringOrNull(clientStrings[21]), 
				planned_altairport: stringOrNull(clientStrings[28]), 
				planned_remarks: stringOrNull(clientStrings[29]), 
				planned_route: stringOrNull(clientStrings[30]), 
				atis_message:stringOrNull(clientStrings[35]), 
				time_logon: stringOrNull(clientStrings[37]),
				heading: parseIntOrNull(clientStrings[38])};
		},
		
		parseClients: function(datalines, lineidx) {
			
			while((datalines[lineidx].substring(0,1) != ';')
				&& (datalines[lineidx].substring(0,1) != '!')) {
				datafeedReader.clientData.push(datafeedReader.parseClient(datalines[lineidx]));
				lineidx++;
			}
			
			return lineidx;
		}
}
		

exports.datafeedreader = datafeedReader;