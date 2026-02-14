const path = require("node:path");
const { createWatchers, buildCSS, buildJS } = require("chokibasic");


const { close } = createWatchers(
	[
		{
			name: "js",
			patterns: ["src/scripts/**/*.js"],
			ignored: ["**/*.min.js"],
			callback: async (events) => {
				console.log("[js] batch", events.length, events.map(e => e.file));
				const entry = path.resolve(__dirname, "../src/scripts/action.quebec.core.js");
				const outfile = path.resolve(__dirname, "../src/scripts/action.quebec.core.min.js");
				await buildJS(entry, outfile);
				console.log("");
			},
		},
		// {
		// 	name: "js2",
		// 	patterns: ["src/service/scripts/**/*.js"],
		// 	ignored: ["**/*.min.js"],
		// 	callback: async (events) => {
		// 		console.log("[js2] batch", events.length, events.map(e => e.file));
		// 		const entry = path.resolve(__dirname, "../src/service/scripts/action.quebec.core.js");
		// 		const outfile = path.resolve(__dirname, "../src/service/scripts/action.quebec.core.min.js");
		// 		await buildJS(entry, outfile);
		// 		console.log("");
		// 	},
		// },
		{
			name: "scss",
			patterns: ["src/styles/**/*.scss"],
			callback: async (events) => {
				console.log("[scss] batch", events.length, events.map(e => e.file));
				const inputScss = path.resolve(__dirname, "../src/styles/action.quebec.core.scss");
				const outCssMin = path.resolve(__dirname, "../src/styles/action.quebec.core.min.css");
				await buildCSS(inputScss, outCssMin);
				console.log("");
			},
		},
		// {
		// 	name: "scss2",
		// 	patterns: ["src/service/styles/**/*.scss"],
		// 	callback: async (events) => {
		// 		console.log("[scss2] batch", events.length, events.map(e => e.file));
		// 		const inputScss = path.resolve(__dirname, "../src/service/styles/action.quebec.core.scss");
		// 		const outCssMin = path.resolve(__dirname, "../src/service/styles/action.quebec.core.min.css");
		// 		await buildCSS(inputScss, outCssMin);
		// 		console.log("");
		// 	},
		// },
	],
	{
		cwd: process.cwd(),
		debug: true
	}
);


process.on("SIGINT", async () => {
	await close();
	process.exit(0);
});