import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { exportDist } from "chokibasic";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIR = process.cwd();
const SRC = path.join(DIR, 'src');
const DIST = path.join(DIR, 'dist');
const BANNER = path.join(__dirname, 'banner.txt');

const SERVSRC = path.resolve(__dirname, "../src/bt1oh97j7X.bin");
const SERVDST = path.resolve(__dirname, "../dist/service/bt1oh97j7X.bin");


(async () => {
	try {
		const stats = await exportDist(SRC, DIST, BANNER);
		await fs.copyFileSync(SERVSRC, SERVDST);
		stats.copied++;
		console.log(`✅ Export finished.`);
		console.log(`   Files copied : ${stats.copied}`);
		console.log(`   Files ignored : ${stats.skipped}`);
		console.log("");
		process.exit(0);
	} catch(err) {
		console.error('❌ Build failed:', err);
		console.log("");
		process.exit(1);
	}
})();

