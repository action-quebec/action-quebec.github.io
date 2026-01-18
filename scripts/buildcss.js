const fs = require("node:fs");
const path = require("node:path");
const sass = require("sass");
const csso = require("csso");

const inputScss = path.resolve(__dirname, "../src/styles/action.quebec.core.scss");
const outCssMin = path.resolve(__dirname, "../src/styles/action.quebec.core.min.css");

let compiled;
try {
	compiled = sass.compile(inputScss, {
		loadPaths: [path.resolve(__dirname, "../node_modules")],
		style: "compressed",
		sourceMap: false,
		sourceMapIncludeSources: false,
	});
} catch (err) {
	console.error("❌ Sass compile error:");
	console.error(err?.formatted || err?.message || err);
	process.exitCode = 1;
	process.exit();
}

const minified = csso.minify(compiled.css, { restructure: false });
fs.writeFileSync(outCssMin, minified.css);
console.log(`✅ CSS generated: ${outCssMin}`);
