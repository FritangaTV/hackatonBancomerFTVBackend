var soccerDates = require('./importantDates.json');

function getSoccerDates(dateString){
	if ( typeof soccerDates[dateString] != "undefined" ){
		return soccerDates[dateString].weight;
	} else {
		return 0;
	}
};

var getDate = getSoccerDates("2016-03-19");
console.log(getDate);