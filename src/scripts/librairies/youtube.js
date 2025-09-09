export default class Youtube {


	opts = {
		observer: false,
	};


	constructor(opts = {}) {
		this.opts = {...this.opts, ...opts};
		this.replaceTags();
	}


	replaceTags(root = document) {
		root.querySelectorAll("youtube").forEach(elm => this.replaceTag(elm));
		
		// root.querySelectorAll("youtube").forEach(el => {
		// 	const id = el.getAttribute("id");
		// 	if (!id) return;

		// 	const iframe = document.createElement("iframe");
		// 	iframe.src = `https://www.youtube.com/embed/${id}?feature=oembed&autoplay=1`;
		// 	iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
		// 	iframe.width = "560";
		// 	iframe.height = "315";
		// 	iframe.frameBorder = "0";
		// 	iframe.allowFullscreen = true;

		// 	el.replaceWith(iframe);
		// });
	}


	async replaceTag(elm) {
		const id = elm.getAttribute("id");
		if (!id) return;
		const data = await this.getInfo(id);
		const denominator = hcd(data.width, data.height);
		const wrapper = create('div', 'youtube');
		wrapper.style.aspectRatio = `${data.width / denominator} / ${data.height / denominator}`;
		wrapper.style.backgroundImage = `url(${data.thumbnail_url})`;
		wrapper.create('div', 'youtube__title', data.title);
		wrapper.create('div', 'youtube__play').addEventListener('click', () => {
			const iframe = create('iframe', 'youtube__player');
			iframe.frameBorder = '0';
			iframe.allowFullscreen = true;
			iframe.width = '100%';
			iframe.height = '100%';
			iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
			iframe.src = `https://www.youtube.com/embed/${id}?feature=oembed&autoplay=1`;
			wrapper.replaceChildren(iframe);
		});

// console.log(ratio);
		elm.replaceWith(wrapper);
		// 'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + id + '&format=json'
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
		} catch (_) { }
		if(!data) throw new Error("Youtube ID invalide.");
		return data;
	}



}