// build.js
// Node >= 16 recommandé
const fs = require('fs/promises');
const fscore = require('fs');
const path = require('path');
const ignore = require('ignore');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const IDXDIST = path.join(DIST, 'index.html');
const CSSDIST = path.join(DIST, 'styles/action.quebec.core.min.css');
const JSDIST = path.join(DIST, 'scripts/action.quebec.core.min.js');
const BANNER = path.join(ROOT, 'scripts/banner.txt');


function norm(p) {
	// normalise en chemin POSIX pour compat .gitignore
	return p.split(path.sep).join('/');
}

async function loadGitignore() {
	const ig = ignore();
	const giPath = path.join(ROOT, '.gitignore');
	if (fscore.existsSync(giPath)) {
		const txt = await fs.readFile(giPath, 'utf8');
		ig.add(txt);
	}
	// on ignore aussi le dossier dist par sécurité (pas nécessaire mais sain)
	ig.add('dist/');
	return ig;
}

async function rmDist() {
	await fs.rm(DIST, { recursive: true, force: true });
	await fs.mkdir(DIST, { recursive: true });
}

function shouldExcludeFile(relFromRoot, absPath) {
	// Exclusions de type/extension
	const lower = absPath.toLowerCase();
	if (lower.endsWith('.scss')) return true;
	if (lower.endsWith('.js') && !lower.endsWith('.min.js')) return true;
	return false;
}

async function copyFilePreserveTree(absSrc, ig) {
	const relFromSrc = path.relative(SRC, absSrc);
	const relFromRoot = path.relative(ROOT, absSrc);
	const relPosix = norm(relFromRoot);

	// 1) Exclusions via .gitignore
	if (ig.ignores(relPosix)) return false;

	// 2) Exclusions spécifiques (scss, js non minifiés)
	if (shouldExcludeFile(relPosix, absSrc)) return false;

	const absDst = path.join(DIST, relFromSrc);
	await fs.mkdir(path.dirname(absDst), { recursive: true });
	await fs.copyFile(absSrc, absDst);
	return true;
}

async function walkAndCopy(dir, ig, stats) {
	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const de of entries) {
		const abs = path.join(dir, de.name);
		const relFromRoot = path.relative(ROOT, abs);
		const relPosix = norm(relFromRoot);

		if (de.isDirectory()) {
			// Si le dossier est ignoré par .gitignore, on ne descend pas
			if (ig.ignores(relPosix + '/')) continue;
			await walkAndCopy(abs, ig, stats);
		} else if (de.isFile()) {
			const copied = await copyFilePreserveTree(abs, ig);
			if (copied) stats.copied++;
			else stats.skipped++;
		}
		// (symlinks & autres: ignorés)
	}
}

(async () => {
	try {
		const ig = await loadGitignore();
		await rmDist();

		// Sanity checks
		if (!fscore.existsSync(SRC)) {
			console.error('Erreur : le dossier /src/ est introuvable.');
			process.exit(1);
		}

		const stats = { copied: 0, skipped: 0 };
		await walkAndCopy(SRC, ig, stats);

		const bannerContent = await fs.readFile(BANNER, 'utf8');
		const idxContent = await fs.readFile(IDXDIST, 'utf8');
		const cssContent = await fs.readFile(CSSDIST, 'utf8');
		const jsContent = await fs.readFile(JSDIST, 'utf8');

		await fs.writeFile(IDXDIST, "<!--\n\n" + bannerContent + "\n\-->\n" + idxContent, "utf8");
		await fs.writeFile(CSSDIST, "/*!\n\n" + bannerContent + "\n\n*/" + cssContent, "utf8");
		await fs.writeFile(JSDIST, "/*!\n\n" + bannerContent + "\n\n*/" + jsContent, "utf8");

		console.log(`✅ Build terminé.`);
		console.log(`   Fichiers copiés : ${stats.copied}`);
		console.log(`   Fichiers ignorés : ${stats.skipped}`);
		process.exit(0);
	} catch (err) {
		console.error('❌ Build échoué:', err);
		process.exit(1);
	}
})();
