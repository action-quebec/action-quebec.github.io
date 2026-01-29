const fs = require('fs/promises');
const fscore = require('fs');
const path = require('path');
const ignore = require('ignore');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const BANNER = path.join(ROOT, 'scripts/banner.txt');


function formatFrDate(dateInput = new Date(), timeZone = 'America/Toronto') {
	const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
	const fmt = new Intl.DateTimeFormat('fr-CA', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: false,
		timeZone
	});
	const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
	const weekday = parts.weekday.charAt(0).toUpperCase() + parts.weekday.slice(1); // "Samedi"
	return `${weekday} le ${parts.day} ${parts.month} ${parts.year} à ${parts.hour} h ${parts.minute}`;
}


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
	return absDst;
}

async function walkAndCopy(dir, ig, stats) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const bannerContent = (await fs.readFile(BANNER, 'utf8')).replace(/###DATE###/, formatFrDate());

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
			if (copied) {
				const lower = abs.toLowerCase();
				if (lower.endsWith('.js')) await fs.writeFile(copied, "/*!\n\n" + bannerContent + "\n\n*/" + (await fs.readFile(copied, 'utf8')), "utf8");
				else if (lower.endsWith('.css')) await fs.writeFile(copied, "/*!\n\n" + bannerContent + "\n\n*/" + (await fs.readFile(copied, 'utf8')), "utf8");
				else if (lower.endsWith('.html')) await fs.writeFile(copied, "<!--\n\n" + bannerContent + "\n\n\-->\n" + (await fs.readFile(copied, 'utf8')).replaceAll(/###YEAR###/g, (new Date).getFullYear()), "utf8");
				stats.copied++;
			}
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

		console.log(`✅ Build terminé.`);
		console.log(`   Fichiers copiés : ${stats.copied}`);
		console.log(`   Fichiers ignorés : ${stats.skipped}`);
		process.exit(0);
	} catch (err) {
		console.error('❌ Build échoué:', err);
		process.exit(1);
	}
})();
