const osmosis = require("osmosis");
const mongoose = require("mongoose");
const ora = require("ora");

const URL = "http://informo.munimadrid.es/informo/tmadrid/pm.xml";
const TIMEOUT = 10 * 60 * 60 * 1000;

const spinner = ora("Conectando con la base de datos").start();
spinner.color = "red";

const MeasurePointSchema = new mongoose.Schema({
	id: String,
	description: String,
	access: String,
	intensity: Number,
	occupancy: Number,
	load: Number,
	level: Number,
	intensitySat: Number,
	error: String,
	subarea: String
});

const MeasurePoint = mongoose.model("mp", MeasurePointSchema);

function request(timeout = TIMEOUT) {
	setTimeout(update, timeout);
}

function update() {

	spinner.color = "yellow";
	spinner.text = `Cargando datos de \x1B[1;35m${URL}\x1B[0m`;

	osmosis
		.get(URL)
		.find("pm")
		.set({
			"id": "codigo",
			"description": "descripcion",
			"access": "accesoAsociado",
			"intensity": "intensidad",
			"occupancy": "ocupacion",
			"load": "carga",
			"level": "nivelServicio",
			"intensitySat": "intensidadSat",
			"error": "error",
			"subarea": "subarea"
		})
		.then((context,data) => {
      if (typeof data.intensity === "string") {
				data.intensity = parseInt(data.intensity, 10);
			}
			if (typeof data.intensitySat === "string") {
				data.intensitySat = parseInt(data.intensitySat, 10);
			}
			if (typeof data.occupancy === "string") {
				data.occupancy = parseInt(data.occupancy, 10);
			}
			if (typeof data.load === "string") {
				data.load = parseInt(data.load, 10);
			}
			if (typeof data.level === "string") {
				data.level = parseInt(data.level, 10);
			}
		})
		.data((listing) => {

			spinner.color = "green";
			spinner.text = `Guardando datos en la base de datos`;

			// @see https://docs.mongodb.com/manual/reference/method/db.collection.insert/
			// Ordered: false inserts documents without ordering and it continues in case
			// one fails.
			MeasurePoint.collection.insert(listing, { ordered: false }, (err, result) => {

				if (err) {
					console.error(err);
					return;
				}

				spinner.color = "red";
				spinner.text = "Esperando...";

			});

		});

	request();
}

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/madrid-trafico").then(() => {
	request(0);
}).catch((err) => {
	console.error(err);
});

