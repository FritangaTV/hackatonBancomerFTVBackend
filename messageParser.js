var buena_onda = require('./public/json/samples/sample1/buena.json');
var regular = require('./public/json/samples/sample1/promedio.json');
var juanita = require('./public/json/samples/sample1/output.json');


function parseToday(selectedClient){

	var today = {};
	var prom = (selectedClient[0].aff_im_txn_min + selectedClient[0].aff_im_txn_max) / 2;
	if(prom > (selectedClient[0].aff_im_mL7D * 1.15) ){
		today.image = 'https://analytics.oglabs.info/images/bueno.png';
		today.text = "Hoy nos va ir muy bien."
	}else if(prom < (selectedClient[0].aff_im_mL7D * 0.85)){
		today.image = 'https://analytics.oglabs.info/images/malo.png';
		today.text = "Lo importante es que hay salud."
	}else{
		today.image = 'https://analytics.oglabs.info/images/normal.png';
		today.text = "Es un día regular en con ventas regulares."
	}
	return today;
}

function parseTips(selectedClient){
	tips = [];
	// Clima
	var today_weather = selectedClient[0].weather;
	var meta = selectedClient[0].meta;
	//Temperatura
	if(today_weather.mean_temp > 29){ // Día caluroso
		tips.push({
			title:"Día caluroso.",
			subtitle: "Contempla alimentos refrescantes.",
			image_url:"https://analytics.oglabs.info/images/tips/bebida_refrescante.jpeg",
			item_url:"https://analytics.oglabs.info/images/tips/bebida_refrescante.jpeg"
		});
	}else if(today_weather.mean_temp < 20){ // Día frio
		tips.push({
			title:"Día frío.",
			subtitle: "Contempla alimentos calientitos.",
			image_url:"https://analytics.oglabs.info/images/tips/bebida_calientita.jpg",
			item_url:"https://analytics.oglabs.info/images/tips/bebida_calientita.jpg"
		});
	}
	// Viento
	if(today_weather.mean_speed > 12){ // Día con viento
		tips.push({
			title:"Día con viento.",
			subtitle: "Contempla tu áreas al aire libre.",
			image_url:"https://analytics.oglabs.info/images/tips/viento.jpeg",
			item_url:"https://analytics.oglabs.info/images/tips/viento.jpeg"
		});
	}
	// Quincena
	if(meta.day_num == "01" || meta.day_num == "02" || meta.day_num == "03" || meta.day_num == "04"
		|| meta.day_num == "15" || meta.day_num == "16" || meta.day_num == "17" || meta.day_num == "18	"){ // Inicio de Quincena
		tips.push({
			title:"Inicio de quincena",
			image_url:"https://analytics.oglabs.info/images/tips/inicio_quincena.jpg",
			item_url:"https://analytics.oglabs.info/images/tips/inicio_quincena.jpg"
		});
	}else if(meta.day_num == "12" || meta.day_num == "13" || meta.day_num == "14"
		|| meta.day_num == "28" || meta.day_num == "29" || meta.day_num == "30" || meta.day_num == "31"){
		tips.push({
			title:"Fin de quincena",
			image_url:"https://analytics.oglabs.info/images/tips/fin_quincena.jpg",
			item_url:"https://analytics.oglabs.info/images/tips/fin_quincena.jpg"
		});
	}
	// Semana
	if(meta.weekday == "Saturday" || meta.weekday == "Sunday"  || meta.weekday == "Friday"){
		tips.push({
			title:"Fin de semana (o viernes)",
			image_url:"https://analytics.oglabs.info/images/tips/fin_semana.jpg",
			item_url:"https://analytics.oglabs.info/images/tips/fin_semana.jpg"
		});
	}else{
		tips.push({
			title:"Entre semana",
			image_url:"https://analytics.oglabs.info/images/tips/entre_semana.jpg",
			item_url:"https://analytics.oglabs.info/images/tips/entre_semana.jpg"
		});
	}
    
    // feriado
    if(meta.feriado != "no" ){
        tips.push({
            title:"Se acerca un día feriado",
            image_url:"https://analytics.oglabs.info/images/tips/feriado.jpg",
            item_url:"https://analytics.oglabs.info/images/tips/feriado.jpg"
        });
    }
	
	// Futbol
	if(meta.partido_seleccion != "no" ){
		tips.push({
			title:"Hoy hay partido de Futbol importante",
			image_url:"https://analytics.oglabs.info/images/tips/futbol.jpg",
			item_url:"https://analytics.oglabs.info/images/tips/futbol.jpg"
		});
	}
	
	return tips;
}
function setSelected(selected){
	var selectedClientJSON;
	switch (selected){
		case 'juanita':
			selectedClientJSON = juanita;
		break;
		case 'buena_onda':
			selectedClientJSON = buena_onda;
		break;
		case 'regular' :
			selectedClientJSON = regular;
		break;
	}
	return selectedClientJSON;
}

module.exports = {
	parseToday: function(selected){
		var selectedClient = setSelected(selected);
		return parseToday(selectedClient);
	},
	parseTips: function(selected){
		var selectedClient = setSelected(selected);
		return parseTips(selectedClient);
	}
}
