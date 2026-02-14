window.SECRETS = (async () => {
	try {
		const response = await fetch(atob('L2J0MW9oOTdqN1guYmlu'), { cache: 'no-store' });
		if (!response.ok) throw new Error(`Error loading secrets: ${response.status}`);
		const data = new Uint8Array([0x1f, 0x8b, ...(new Uint8Array(await response.arrayBuffer()))]);
		return JSON.parse(atob((await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"))).text())
			.replace(/[A-Za-z]/g, c => {
				const base = c <= "Z" ? 65 : 97;
				return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
			})));
	} catch (error) {
		console.error(error.message);
	}
})();