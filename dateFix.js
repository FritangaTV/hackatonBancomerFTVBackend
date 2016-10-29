var mysql 	= require('mysql');
var moment 	= require('moment');
var pool  	= mysql.createPool({
  connectionLimit : 10,
  host            : '127.0.01',
  user            : 'root',
  password        : '',
  database        : 'food_data'
});


function FixDates(){
	var fixedInfo = [];
	pool.getConnection(function(err, connection) {
  		connection.query( 'SELECT id,date_year,date_month, date_day FROM transactions', function(err, rows) {
  			rows.forEach(function(row){
  				var dateMYSQL = moment().set({
	  				'year': row.date_year,
	  				'month': row.date_month-1,
	  				'date' : row.date_day,
	  				'hour' : 0,
	  				'minute': 0,
	  				'second' : 0
	  			}).format('YYYY-MM-DD HH:mm:ss');
	  			row.date = dateMYSQL;
	  			var updatedRow = row;
	  			fixedInfo.push(updatedRow);
  			});
    		connection.release();
    		insertData(fixedInfo);
  		});
	});
};

function insertData(fixedInfo){
	fixedInfo.forEach(function(updatedRow){
		console.log('updating:', updatedRow.id);
		pool.getConnection(function(err, con) {
			console.log('conected');
			con.query( 'UPDATE transactions SET date = ? WHERE id = ?', [updatedRow.date, updatedRow.id], function(err, rowsU) {
				console.log('updated:', updatedRow.id);
			});
			con.release();
		});
	});
};

FixDates();