var express = require('express');
var app 	= express();
var mysql 	= require('mysql');
var moment 	= require('moment');
var pool  	= mysql.createPool({
  connectionLimit : 10,
  host            : '127.0.01',
  user            : 'root',
  password        : '',
  database        : 'food_data'
});

app.use(express.static('public'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.get('/', function (req, res) {
	res.sendFile('index.html');
});

app.get('/a', function(req,res){
	pool.getConnection(function(err, conn){
		conn.query('SELECT DISTINCT id_afil FROM transactions ORDER BY id_afil ASC', function(err, rows){
			res.json(rows);
			conn.release();
		});
	});
});

app.get('/t', function(req, res){
	if ( typeof req.query.client == "undefined" || typeof req.query.endDate == "undefined" || typeof req.query.initDate == "undefined" ){
		res.status(500).send('Not enough minerals');
		return;
	};

	var client_id = req.query.client;
	var initDate = req.query.initDate;
	var endDate = req.query.endDate;

	var doQuery = "SELECT SUM(t.im_txn) AS money_total, SUM(t.to_txn) AS trans_count, SUM(t.to_ctes) AS clients, SUM(t.to_tarjetas) AS cards, t.date, t.cd_postal_cmr AS cd_postal_cmr, w.*, a.promedio AS anivs FROM transactions t INNER JOIN (SELECT * FROM weather) w ON t.date = w.date INNER JOIN (SELECT * FROM aniversarios) a ON t.date = a.dia WHERE t.id_afil = ? AND (t.`date` BETWEEN ? AND ?) GROUP BY t.date, w.date;";
	var queryResults;
	var sendResults = {};
	pool.getConnection(function(err, connection) {
  	connection.query( doQuery,[client_id, initDate, endDate], function(err, rows) {
  			queryResults = rows;
  			var client_cp = rows[0].cd_postal_cmr;
    		queryResults.forEach(function(row){
    			var proccesedDate = moment(row.date).format('YYYY-MM-DD');
    			var metaDate = moment(row.date);
    			sendResults[proccesedDate] = {
    				"meta": getMeta(metaDate, row.anivs),
    				"transactions": {
    					"money_total": row.money_total,
    					"trans_count": row.trans_count,
    					"clients": row.clients,
    					"cards": row.cards
    				},
    				"weather": {
    					"min_temp": row.min_t,
    					"max_temp": row.max_t,
    					"mean_temp": row.mid_t,
    					"dew_point" : row.dew,
						"mean_dew" : row.m_dew,
						"min_dew" : row.min_dew,
						"max_hum" : row.max_hum,
						"mean_hum" : row.m_hum,
						"min_hum" : row.min_hum,
						"max_pressure" : row.max_pre,
						"mean_pressure" : row.m_pre,
						"min_pressure" : row.min_pre,
						"max_pressure" : row.max_vis,
						"mean_visibility" : row.m_vis,
						"min_visibility" : row.min_vis,
						"max_speed" : row.max_vel,
						"mean_speed" : row.m_vel,
						"min_speed" : row.min_vel,
						"max_blow" : row.max_raf,
						"prec" : row.pre,
						"clouds" : row.cloud_cover,
						"event" : row.event
    				}
    			};
    			
    		});
    		var areaQuery = "SELECT SUM(t.im_txn) AS money_total, SUM(t.to_txn) AS trans_count, SUM(t.to_ctes) AS clients, SUM(t.to_tarjetas) AS cards, t.date, w.*, a.promedio AS anivs FROM transactions t INNER JOIN (SELECT * FROM weather) w ON t.date = w.date INNER JOIN (SELECT * FROM aniversarios) a ON t.date = a.dia WHERE cd_postal_cmr = ? AND (t.date BETWEEN ? AND ?) GROUP BY t.date;";

    		connection.query(areaQuery,[client_cp, initDate, endDate],function(err, areaRows){
    			console.log('adding area', areaRows.length);
    			areaRows.forEach(function(areaRow){
    				var proccesedDate = moment(areaRow.date).format('YYYY-MM-DD');
    				var metaDate = moment(areaRow.date);
    				if ( typeof sendResults[proccesedDate] == "undefined" ){
    					sendResults[proccesedDate] = {
    						"meta": getMeta(metaDate, areaRow.anivs),
    						"weather": {
		    					"min_temp": areaRow.min_t,
		    					"max_temp": areaRow.max_t,
		    					"mean_temp": areaRow.mid_t,
		    					"dew_point" : areaRow.dew,
								"mean_dew" : areaRow.m_dew,
								"min_dew" : areaRow.min_dew,
								"max_hum" : areaRow.max_hum,
								"mean_hum" : areaRow.m_hum,
								"min_hum" : areaRow.min_hum,
								"max_pressure" : areaRow.max_pre,
								"mean_pressure" : areaRow.m_pre,
								"min_pressure" : areaRow.min_pre,
								"max_pressure" : areaRow.max_vis,
								"mean_visibility" : areaRow.m_vis,
								"min_visibility" : areaRow.min_vis,
								"max_speed" : areaRow.max_vel,
								"mean_speed" : areaRow.m_vel,
								"min_speed" : areaRow.min_vel,
								"max_blow" : areaRow.max_raf,
								"prec" : areaRow.pre,
								"clouds" : areaRow.cloud_cover,
								"event" : areaRow.event
		    				}
    					};
    				};
    				sendResults[proccesedDate].area = {
    					"money_total": areaRow.money_total,
						"trans_count": areaRow.trans_count,
						"clients": areaRow.clients,
						"cards": areaRow.cards
					};
    			});
    			var finalDate = moment(endDate).add(7, 'days').format('YYYY-MM-DD');
    			connection.query('SELECT w.*, a.promedio AS anivs FROM weather w INNER JOIN (SELECT promedio,dia FROM aniversarios) a ON w.date = a.dia WHERE (w.date BETWEEN ? AND ?);', [initDate, finalDate], function(err, dateRows){
    				dateRows.forEach(function(dateRow){
    					var proccesedDate = moment(dateRow.date).format('YYYY-MM-DD');
    					var metaDate = moment(dateRow.date);
    					if ( typeof sendResults[proccesedDate] == "undefined"  ){
    						sendResults[proccesedDate] = {
    							"meta": getMeta(metaDate, dateRow.anivs),
    							"weather": {
			    					"min_temp": dateRow.min_t,
			    					"max_temp": dateRow.max_t,
			    					"mean_temp": dateRow.mid_t,
			    					"dew_point" : dateRow.dew,
									"mean_dew" : dateRow.m_dew,
									"min_dew" : dateRow.min_dew,
									"max_hum" : dateRow.max_hum,
									"mean_hum" : dateRow.m_hum,
									"min_hum" : dateRow.min_hum,
									"max_pressure" : dateRow.max_pre,
									"mean_pressure" : dateRow.m_pre,
									"min_pressure" : dateRow.min_pre,
									"max_pressure" : dateRow.max_vis,
									"mean_visibility" : dateRow.m_vis,
									"min_visibility" : dateRow.min_vis,
									"max_speed" : dateRow.max_vel,
									"mean_speed" : dateRow.m_vel,
									"min_speed" : dateRow.min_vel,
									"max_blow" : dateRow.max_raf,
									"prec" : dateRow.pre,
									"clouds" : dateRow.cloud_cover,
									"event" : dateRow.event
			    				}
	    					};
    					}
    				});
    				res.json(sendResults);
    				connection.release();
    			});
    		});
  		});
	});
});

app.listen(1337, function () {
	console.log('DATA API RUNNING');
});

function isFeriado(check){

	var result;
	var feriados = ["2016-01-01",
		"2016-02-05",
		"2016-03-21",
		"2016-05-01",
		"2016-09-16",
		"2016-11-20",
		"2016-12-01",
		"2016-12-25",
		"2016-02-19",
		"2016-02-24",
		"2016-03-18",
		"2016-04-21",
		"2016-05-05",
		"2016-05-08",
		"2016-06-01",
		"2016-09-13",
		"2016-09-15",
		"2016-09-27",
		"2016-09-30",
		"2016-10-12",
		"2016-01-06",
		"2016-02-14",
		"2016-04-30",
		"2016-05-10",
		"2016-05-15",
		"2016-05-23",
		"2016-05-25",
		"2016-08-28",
		"2016-11-01",
		"2016-11-02",
		"2016-12-12",
		"2016-12-16",
		"2016-12-24",
		"2016-12-31"];
	var partidos_seleccion_mexicana = [
		'2016-02-10',
		'2016-03-25',
		'2016-03-29',
		'2016-05-28',
		'2016-06-01',
		'2016-06-05',
		'2016-06-09',
		'2016-06-13',
		'2016-06-18',
		'2016-09-02',
		'2016-09-06',
		'2016-10-08',
		'2016-10-11',
		'2016-11-11',
		'2016-11-15'
	];
	console.log("feriado check", feriados.indexOf(check) );
	if ( feriados.indexOf(check)> -1 ){
		console.log("feriado!!!!");
		result = "yes";
	} else {
		result = "no";
	};
	return result;
}

function getMeta(metaDate, anivs){
	var metaData = {
		"day_num": metaDate.format('DD'),
		"weekday": metaDate.format('dddd'),
		"feriado": isFeriado(metaDate.format('YYYY-MM-DD') ),
		"aniversarios": anivs
	}
	return metaData;
}
