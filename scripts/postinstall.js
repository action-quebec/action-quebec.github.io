const fs = require("fs");
const https = require("https");
const path = require("path");

const url = "https://action.quebec/bt1oh97j7X.json";
const dest = path.resolve(__dirname, "../src/bt1oh97j7X.json");

https.get(url, res => {
	if (res.statusCode !== 200) {
		console.error(`❌ Échec du téléchargement: ${res.statusCode}`);
		process.exit(1);
	}
	let data = "";
	res.on("data", chunk => (data += chunk));
	res.on("end", () => {
		fs.writeFileSync(dest, data, "utf8");
		console.log(`✅ Fichier téléchargé dans ${dest}`);
	});
}).on("error", err => {
	console.error("❌ Erreur:", err.message);
	process.exit(1);
});
