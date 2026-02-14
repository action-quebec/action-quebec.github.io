const path = require("path");
const { buildCSS, buildJS } = require("chokibasic");

(async () => {
	await buildJS(
		path.resolve(__dirname, "../src/scripts/action.quebec.core.js"),
		path.resolve(__dirname, "../src/scripts/action.quebec.core.min.js")
	);

	await buildJS(
		path.resolve(__dirname, "../src/service/scripts/action.quebec.core.js"),
		path.resolve(__dirname, "../src/service/scripts/action.quebec.core.min.js")
	);

	await buildCSS(
		path.resolve(__dirname, "../src/styles/action.quebec.core.scss"),
		path.resolve(__dirname, "../src/styles/action.quebec.core.min.css")
	);

	await buildCSS(
		path.resolve(__dirname, "../src/service/styles/action.quebec.core.scss"),
		path.resolve(__dirname, "../src/service/styles/action.quebec.core.min.css")
	);
})();
