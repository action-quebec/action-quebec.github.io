export default class YoutubeReplacer {

	observer = null;

	patterns = [
		/(?:^|\/\/)youtu\.be\/([A-Za-z0-9_-]{11})(?:[?&#/]|$)/i,
		/(?:^|\/\/)(?:www\.)?(?:m\.)?youtube\.com\/watch\?(?:[^#]*?&)?v=([A-Za-z0-9_-]{11})(?:[&#]|$)/i,
		/(?:^|\/\/)(?:www\.)?(?:m\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{11})(?:[?&#/]|$)/i,
		/(?:^|\/\/)(?:www\.)?(?:m\.)?youtube\.com\/v\/([A-Za-z0-9_-]{11})(?:[?&#/]|$)/i,
		/(?:^|\/\/)(?:www\.)?(?:m\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})(?:[?&#/]|$)/i
	];

	opts = {
		observer: false,
	};


	constructor(opts = {}) {
		this.opts = { ...this.opts, ...opts };
		this.replaceTags();
		if (this.opts.observer) {
			this.observer = new MutationObserver(mutations => {
				mutations.map(async m => {
					return Promise.all([...m.addedNodes].map(async n => {
						if (n.nodeType === 1) {
							if(n.tagName.toLowerCase() == 'youtube') return this.replaceTags(n.parentNode);
							else return this.replaceTags(n);
						}
					}));
				});
			});
			this.observer.observe(document.body, { childList: true, subtree: true });
		}
	}


	replaceTags(root = document) {
		return Promise.all([...root.querySelectorAll("youtube")].map(elm => this.replaceTag(elm)));
	}


	async replaceTag(elm) {
		try {
			const id = elm.getAttribute("id");
			if (!id) return;
			const data = await this.getInfo(id);
			const denominator = hcd(data.width, data.height);
			const wrapper = create('div', 'youtube');
			wrapper.style.aspectRatio = `${data.width / denominator} / ${data.height / denominator}`;
			wrapper.style.backgroundImage = `url(${data.thumbnail_url})`;
			wrapper.create('div', 'youtube__title', data.title);
			wrapper.create('div', 'youtube__play').addEventListener('click', async () => {
				const iframe = create('iframe', 'youtube__player');
				iframe.frameBorder = '0';
				iframe.allowFullscreen = true;
				iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
				iframe.src = `https://www.youtube.com/embed/${id}?feature=oembed&autoplay=1`;
				wrapper.replaceChildren(iframe);
			});
			elm.replaceWith(wrapper);
		} catch(e) {
			console.log(e);
		}
	}


	async getInfo(id) {
		if(!id) return null;
		const key = `youtube_${id}`;
		let data = null;
		try {
			const cache = localStorage.getItem(key);
			if (cache) {
				data = JSON.parse(cache);
			} else {
				const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
				if (res.ok) {
					data = await res.json();
					localStorage.setItem(key, JSON.stringify(data));
				}
			}
		} catch (e) { throw new Error("Youtube ID invalide.") }
		return data;
	}


	extractYouTubeId(url) {
		const u = url.replace(/&amp;/gi, "&");
		return this.patterns.reduce((res, p) => res ?? u.match(p)?.[1] ?? null, null); 
	}


	replaceAnchors(html) {
		if (!html) return html;
		const A_TAG_RE = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>[\s\S]*?<\/a>/gi;
		return html.replace(A_TAG_RE, (full, h1, h2, h3) => {
			const href = (h1 || h2 || h3 || "").trim();
			const id = this.extractYouTubeId(href);
			return id ? `<youtube id="${id}"></youtube>` : full;
		});
	}


}