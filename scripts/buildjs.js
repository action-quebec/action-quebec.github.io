const path = require("node:path");
const esbuild = require("esbuild");

const entry = path.resolve(__dirname, "../src/scripts/action.quebec.core.js");
const outfile = path.resolve(__dirname, "../src/scripts/action.quebec.core.min.js");

(async () => {
	try {
		await esbuild.build({
			entryPoints: [entry],
			outfile,
			bundle: true,
			platform: "browser",
			logLevel: "error",
			treeShaking: true,
			minify: true,
			supported: { "template-literal": false },
			target: ["es2020"],
			legalComments: "none",
		});
		console.log(`✅ JS généré: ${outfile}`);
	} catch (err) {
		console.error("❌ esbuild build failed.");
		if (err?.errors?.length) {
			const formatted = await esbuild.formatMessages(err.errors, {
				kind: "error",
				color: true,
				terminalWidth: process.stdout.columns || 80,
			});
			console.error(formatted.join("\n"));
		} else {
			console.error(err);
		}
		process.exitCode = 1;
	}
})();
