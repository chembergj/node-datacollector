var http = require('http');


var serverlistReader =  {

	// Extract and map array of url0=http://... to array of http://
	parseServerList: function(data) {
	 	var urls = data.match(/url0=(.*)/g);
		return urls.map(function(url) { return url.substr(5, url.length-5); });
	},
	
	readServerList: function(url, callback) {
		var request = http.get(url, function(response) {
			
			var body = '';
			response.on('data', function(data) { 
				body += data; 
			});
			
			response.on('end', function() {
				callback(null, serverlistReader.parseServerList(body));
			});
		});
		request.on('error', function(e) { callback(e, null); });
	}
};

module.exports = serverlistReader;
