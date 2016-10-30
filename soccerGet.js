var moment 		= require('moment');
var fs 			= require('fs');

var jsonfile = require('jsonfile');
var mysql 	= require('mysql');
var moment 	= require('moment');
var pool  	= mysql.createPool({
  connectionLimit : 10,
  host            : '127.0.01',
  user            : 'root',
  password        : '',
  database        : 'food_data'
});
var request 	= require('superagent');
var Throttle    = require('superagent-throttle');
var throttle = new Throttle({
  active: true,     // set false to pause queue
  rate:1,          // how many requests can be sent every `ratePer`
  ratePer: 2000,   // number of ms in which `rate` requests may be sent
  concurrent: 1     // how many requests can be sent concurrently
});


function getDates(callback){
	pool.getConnection(function(err, conn){
		conn.query('SELECT DISTINCT date FROM weather', function(err, rows){
			callback(rows);
			conn.release();
		});
	});
};

getDates(function(dates){
	dates.forEach(function(dateRow){
		var checkDate = moment(dateRow.date).format('YYYY-MM-DD');
		console.log('checking:', checkDate);
		getSoccerData(checkDate);
	});
	/*var checkDate = moment(dates[100].date).format('YYYY-MM-DD');
		console.log('checking:', checkDate);
		getSoccerData(checkDate);*/
})



function getSoccerData(dateSchedule){
	var soccerDataAM = 'https://api.sportradar.us/soccer-t3/am/en/schedules/'+dateSchedule+'/schedule.json?api_key=nun6jg8chg6627kz3gxa5shy';
	var getString = 'https://api.sportradar.us/soccer-t3/eu/na/schedules/'+dateSchedule+'/schedule.json?api_key=dd4jc64chw3ag7vb9hk6t3a8'
	console.log('getting:', soccerDataAM);
	request
		.get(soccerDataAM)
		.use(throttle.plugin())
		.end(function(err,res){
			console.log(err ? err : 'retrieved ' + dateSchedule);
			console.log('writting:', dateSchedule);
	   		jsonfile.writeFile('soccerDataAM/'+dateSchedule+'.json', res.body, function (err) {
	  			console.error(err)
			})
	   	});
};
