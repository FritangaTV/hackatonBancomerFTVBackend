var express = require('express');
var app 	= express();
var mysql 	= require('mysql');
var moment 	= require('moment');
var config 	= require('./config.json');
var pool  	= mysql.createPool({
  connectionLimit : 10,
  host            : config.dbHost,
  user            : config.dbUser,
  password        : config.dbPass,
  database        : config.dbName
});
var request = require('request');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var FBMessageParser = require('./messageParser.js');


app.use(express.static('public'));
app.use(bodyParser.json({ verify: verifyRequestSignature }));
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


//**FB Bot **//

app.get('/webhook', function (req, res) {
	if (req.query['hub.verify_token'] === config.fbChallenge) {
	  res.send(req.query['hub.challenge']);
	} else {
	  res.send('Error, wrong validation token');    
	}
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  if (data.object === 'page') {

    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if ( event.postback ){
        	sendPrediction(event);
    	} else {
          //console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.sendStatus(200);
  }
});


function receivedMessage(event) {
	if (!event.message){
		return false;
	};
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  var messageId = message.mid;


  var messageText = message.text.toLowerCase();
  var messageAttachments = message.attachments;

  if (messageText) {

    switch (messageText) {
      case 'lista':
      	sendClientList(senderID);
      	break;
      default:
        sendTextMessage(senderID);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendTextMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Hola soy un bot en desarrollo y no entiendo tu mensaje, peudes intentar con uno de los siguientes comandos: lista"
    }
  };

  callSendAPI(messageData);
}


function callSendAPI(messageData, callback) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: config.fbToken},
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;
      if ( typeof callback != "undefined" ){
      	callback(true);
      };
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

function sendClientList(recipientID){
	var messageData = {
		recipient : {
			id : recipientID
		},
		message : {
			attachment : {
				type : "template",
				payload : {
					template_type : "generic",
					elements : [
						{
							title: "Fonda Juanita",
							subtitle : "Primer ejemplo de datos",
							image_url: "https://analytics.oglabs.info/images/logos/juanita.jpg",
							buttons : [{
								type: "postback",
								title: "Ver predicción",
								payload: "juanita"
							}]
						},
						{
							title: "Buena onda",
							subtitle : "Ejemplo de predicción positivo",
							image_url: "https://analytics.oglabs.info/images/logos/goodVibes.jpg",
							buttons : [{
								type: "postback",
								title: "Ver predicción",
								payload: "buena_onda"
							}]
						},
						{
							title: "El regular",
							subtitle : "Ejemplo de predicción regular",
							image_url: "https://analytics.oglabs.info/images/logos/regular.jpg",
							buttons : [{
								type: "postback",
								title: "Ver predicción",
								payload: "regular"
							}]
						}
					]
				}
			}
		}
	};
	callSendAPI(messageData);	
};

function sendPrediction(messageEvent){

	var senderID = messageEvent.sender.id;
	var target = messageEvent.postback.payload;
	var todayData = FBMessageParser.parseToday(target);
	var imageMessage = {
		recipient: {
			id: senderID
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: todayData.image
				}
			}
		}
	};
	var textMessage = {
		recipient: {
			id: senderID
		},
		message: {
			text: todayData.text
		}
	};
	var tipsMessage = {
		recipient : {
			id : senderID
		},
		message : {
			attachment : {
				type : "template",
				payload : {
					template_type : "generic",
					elements : FBMessageParser.parseTips(target)
				}
			}
		}
	};
	callSendAPI(imageMessage, function(){
		callSendAPI(textMessage, function(){
			callSendAPI(tipsMessage);
		});
	});
}

app.listen(1337, function () {
	console.log('DATA API RUNNING');
});


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

var feriados = [
	"2016-01-01",
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
	"2016-12-31"
];

var soccerDates = require('./importantDates.json');

function isFeriado(check){
	var result = "no";
	if ( feriados.indexOf(check)> -1 ){
		result = "yes";
	};
	return result;
}

function getSeleccion(check){
	var result = "no";
	if ( partidos_seleccion_mexicana.indexOf(check)> -1 ){
		result = "yes";
	};
	return result;
};

function getSoccerDates(dateString){
	if ( typeof soccerDates[dateString] != "undefined" ){
		return soccerDates[dateString].weight;
	} else {
		return 0;
	}
};


function getMeta(metaDate, anivs){
	var metaData = {
		"day_num": metaDate.format('DD'),
		"weekday": metaDate.format('dddd'),
		"feriado": isFeriado(metaDate.format('YYYY-MM-DD') ),
		"partido_seleccion": getSeleccion(metaDate.format('YYYY-MM-DD') ),
		"soccer_weight": getSoccerDates(metaDate.format('YYYY-MM-DD') ),
		"aniversarios": anivs
	}
	return metaData;
}

function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', config.fbSecret)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

