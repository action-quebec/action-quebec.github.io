const path = require('path');
const fs = require('fs/promises');
const { exportDist } = require("chokibasic");


const DIR = process.cwd();
const SRC = path.join(DIR, 'src');
const DIST = path.join(DIR, 'dist');
const BANNER = path.join(__dirname, 'banner.txt');

const SERVSRC = path.resolve(__dirname, "../src/bt1oh97j7X.bin");
const SERVDST = path.resolve(__dirname, "../dist/service/bt1oh97j7X.bin");


(async () => {
	try {
		const stats = await exportDist(SRC, DIST, BANNER);
		await fs.copyFile(SERVSRC, SERVDST);
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

