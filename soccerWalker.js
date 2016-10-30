var filewalker  = require('filewalker');
var _           = require('underscore');
var jsonfile    = require('jsonfile');
var moment      = require('moment');

var importantTeams = [
  "FC Barcelona",
  "Juventus Turin",
  "Liverpool FC",
  "Real Madrid",
  "Bayern Munich",
  "Arsenal FC",
  "Atletico Madrid",
  "Manchester United",
  "CF Pachuca",
  "Leon",
  "CF Monterrey",
  "Unam Pumas",
  "America de Mexico",
  "Deportivo Toluca",
  "Cruz Azul",
  "Guadalajara Chivas",
  "Necaxa",
  "AC Milan",
  "Juventus Turin",
  "Inter Milan",
  "PSV Eindhoven",
  "Bayer Leverkusen",
  "FC Porto",
  "Villarreal CF",
  "SL Benfica"
];

var importantDates = {};


filewalker('./soccerData')
  .on('file', function(p, s) {
    if ( p.indexOf('.json') > 0 ){
      var dayData = require('./soccerData/' + p);
      if ( typeof dayData.message == "undefined" ){
        if ( typeof dayData.sport_events != "undefined" ){
          console.log('has data');
          dayData.sport_events.forEach(function(sportEvent){
            sportEvent.competitors.forEach(function(competitor){
              console.log('team:', competitor.name);
              if ( importantTeams.indexOf(competitor.name) > -1  ){
                var dateString = moment(sportEvent.scheduled).format('YYYY-MM-DD');
                if ( typeof importantDates[dateString] == "undefined" ){
                  importantDates[dateString] = {
                    weight: 1
                  };
                } else {
                  importantDates[dateString].weight++;
                }
              };
            });
          })
        };
      } else {
        console.log('has no data');
      };
    }
  })
  .on('error', function(err) {
    console.error(err);
  })
  .on('done', function() {
    console.log(importantDates);
    jsonfile.writeFile('./importantDates.json', importantDates, function (err) {
      console.error(err)
    })
  })
.walk();
