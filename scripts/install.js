import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const url = "https://action.quebec/bt1oh97j7X.bin";
const dest = path.resolve(__dirname, "../src/bt1oh97j7X.bin");


https.get(url, res => {
  if (res.statusCode !== 200) {
    console.error(`❌ Échec du téléchargement: ${res.statusCode}`);
    res.resume(); // drain
    process.exit(1);
  }
  const chunks = [];
  res.on("data", chunk => chunks.push(chunk)); // chunk est un Buffer
  res.on("end", () => {
    const buf = Buffer.concat(chunks);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf); // <-- pas d'encoding
    console.log(`✅ Fichier téléchargé (binaire) dans ${dest} — ${buf.length} bytes`);
  });
}).on("error", err => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});