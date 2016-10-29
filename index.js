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

app.get('/', function (req, res) {
	res.send('Hello World!');
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
	var doQuery = "SELECT SUM(t.im_txn) AS money_total, SUM(t.to_txn) AS trans_count, SUM(t.to_ctes) AS clients, SUM(t.to_tarjetas) AS cards, t.date, t.cd_postal_cmr AS cd_postal_cmr, w.*, a.promedio AS anivs FROM transactions t INNER JOIN (SELECT * FROM weather) w ON t.date = w.date INNER JOIN (SELECT * FROM aniversarios) a ON t.date = a.dia WHERE t.id_afil = ? AND (t.`date` BETWEEN '20015-12-01' AND '2016-03-01') GROUP BY t.date, w.date;";
	var queryResults;
	var sendResults = {};
	//var client_id = 6992;
	var client_id = req.query.client;
	pool.getConnection(function(err, connection) {
  	connection.query( doQuery,[client_id], function(err, rows) {
  			queryResults = rows;
  			var client_cp = rows[0].cd_postal_cmr;
    		queryResults.forEach(function(row){
    			var proccesedDate = moment(row.date).format('YYYY-MM-DD');
    			var metaDate = moment(row.date);
    			sendResults[proccesedDate] = {
    				"meta":{
    					"day_num": metaDate.format('DD'),
    					"weekday": metaDate.format('dddd'),
    					"feriado": isFeriado(metaDate.format('YYYY-MM-DD') ),
    					"aniversarios": row.anivs
    				},
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
    		var areaQuery = "SELECT SUM(t.im_txn) AS money_total, SUM(t.to_txn) AS trans_count, SUM(t.to_ctes) AS clients, SUM(t.to_tarjetas) AS cards, t.date, w.* FROM transactions t INNER JOIN (SELECT * FROM weather) w ON t.date = w.date WHERE cd_postal_cmr = '06700' AND (t.date BETWEEN '20015-12-01' AND '2016-03-01') GROUP BY t.date;";

    		connection.query(areaQuery,[client_cp],function(err, areaRows){
    			
    			areaRows.forEach(function(areaRow){
    				var proccesedDate = moment(areaRow.date).format('YYYY-MM-DD');
    				if ( typeof sendResults[proccesedDate] == "undefined" ){
    					sendResults[proccesedDate] = {
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
    			res.json(sendResults);
    			connection.release();
    		});
  		});
	});
});

app.listen(3000, function () {
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
	if ( feriados.indexOf(check)< -1 ){
		result = "yes";
	} else {
		result = "no";
	};
	return result;
}