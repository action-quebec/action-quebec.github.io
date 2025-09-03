export default class Croper {


	opts = {

	};

	
	constructor(opts = {}) {
		this.opts = { ...this.opts, ...opts };
		console.log('Hello croper!');

		// this.copyLabeledLink('image-couverture', 'https://ssjb.com/files/uploads/2025/04/00d7f9add1943e0d81fab7adb379adfc.jpg');

		// this.copyLabeledLinks([
		// 	{ label: 'Affiche (1200x675)', url: 'https://exemple.com/affiche.jpg' },
		// 	{ label: 'Carré (1080x1080)', url: 'https://exemple.com/carre.jpg' },
		// 	{ label: 'Bannière',          url: 'https://exemple.com/banner.jpg' }
		// ]);
	}



	async copyLabeledLinks(links) {
		const esc = s => s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
		const html = links.map(({ label, url }) => `<a href="${esc(url)}">${esc(label)}</a>`).join('<br>') + '<br>';
		const text = links.map(({ label, url }) => `${label} — ${url}`).join('\n');
		await navigator.clipboard.write([
			new ClipboardItem({
				'text/html': new Blob([html], { type: 'text/html' }),
				'text/plain': new Blob([text], { type: 'text/plain' })
			})
		]);
	}

}