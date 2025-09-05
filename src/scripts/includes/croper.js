import DNDZone from "../librairies/dndzone";
import ImageFrame from "../librairies/imageframe";


export default class Croper {

	PROXY_BASE = 'https://catbox-proxy.action-quebec.workers.dev';

	container = null;
	imagegroup = null;
	imageL = null;
	imageR = null;
	image = null;

	frameL = null;
	frameR = null;

	btngroup = null;
	uploadbtn = null;
	browsebtn = null;

	results = null;
	copybtn = null;
	links = null;
	
	splash = null;
	splashdnd = null;

	loader = null;

	
	constructor() {
		this.container = document.querySelector('.croper');
		this.imagegroup = create('div', 'croper__images');
		this.image = create('img');
		this.imageL = this.imagegroup.create('div', 'croper__images__box box--2-3');
		this.imageR = this.imagegroup.create('div', 'croper__images__box box--5-4');
		this.btngroup = create('div', 'croper__button');
		this.uploadbtn = this.btngroup.create('button', null, 'Téléverser');
		this.uploadbtn.addEventListener('click', e => this.uploadFiles());
		this.browsebtn = this.btngroup.create('button', null, 'Parcourir');
		this.browsebtn.addEventListener('click', e => this.browseFile(e));

		this.results = create('div', 'croper__results show');
		this.results.create('div', 'croper__results__winner').title = `Tu veux-tu une médaille?`;
		this.results.create('div', 'croper__results__congrats', `Félicitation!`);
		this.results.create('div', 'croper__results__text', `Image téléversée avec succès. Il ne reste qu’à Copier les liens et les coller dans le calendrier Google.`);
		this.copybtn = this.results.create('button', 'croper__results__copy', `Copier les liens`);
		this.copybtn.addEventListener('click', e => this.copyLinks());

		this.splash = create('div', 'croper__splash', `Glissez-déposez votre image ici ou<br> cliquez ici pour choisir un fichier.`);
		this.splash.addEventListener('click', e => this.browseFile(e));
		this.splashdnd = new DNDZone(this.splash, { onFileDrop: file => this.handleFile(file) });

		this.loader = create('div', 'croper__loader');
		this.loader.create('div', 'loading-double-circular');

		this.frameL = new ImageFrame(this.imageL, '2/3');
		this.frameR = new ImageFrame(this.imageR, '5:4');

		this.container.replaceChildren(this.imagegroup, this.btngroup, this.results, this.splash, this.loader);
	}


	async handleFile(dropFile) {
        if(dropFile.type.startsWith('image/') && dropFile.size <= 5242880) {
			this.loadImage(dropFile);
        }
    }


	async browseFile(e) {
		browse('image/*', evt => {
			if (evt.target.files.length > 0) {
				this.handleFile(evt.target.files[0]);
			}
		});
	}


	async loadImage(file) {
		this.image.src = URL.createObjectURL(file);
		this.frameL.loadImage(file);
		this.frameR.loadImage(file);
		this.splash.classList.remove('show');
	}


	async uploadFiles() {
		this.loader.classList.add('show');
		try {
			// const blobs = await Promise.all([
			// 	this.exportBlob(640),
			// 	this.frameR.exportBlob(140, 'webp'),	
			// 	this.frameL.exportBlob(280, 'webp'),
			// ]);

			// const links = await Promise.all([
			// 	this.uploadBlob(blobs[0]),
			// 	this.uploadBlob(blobs[1]),
			// 	this.uploadBlob(blobs[2]),
			// ]);
			await sleep(1000)
			this.links = [
				"https://files.catbox.moe/zi3o0j.webp",
				"https://files.catbox.moe/71fg0x.webp",
				"https://files.catbox.moe/g3hwgs.webp",
			];



			console.log(links);
			// console.log(blobs);

			// this.uploadBlob(blobs[0]);
					
		} catch (err) {
			console.error(err.message || err);
		}
	}


	async exportBlob(outW) {
		const outH = outW * this.image.naturalHeight / this.image.naturalWidth;
		const cvs = document.createElement('canvas');
		cvs.width = outW;
		cvs.height = outH;
		const ctx = cvs.getContext('2d', { alpha: true });
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(this.image, 0, 0, this.image.naturalWidth, this.image.naturalHeight, 0, 0, outW, outH);
		return new Promise((res, rej) => {
			cvs.toBlob(b => b ? res(b) : rej(new Error('toBlob() a échoué')), `image/webp`, 0.92);
		});
	}


	async uploadBlob(blob) {
		const fd = new FormData();
		fd.append('reqtype', 'fileupload');
		fd.append('fileToUpload', new File([blob], `blob.webp`, { type: blob.type }));
		const resp = await fetch(`${this.PROXY_BASE}/api/catbox`, { method: 'POST', body: fd });
		const text = (await resp.text()).trim();
		if (!resp.ok || !/^https?:\/\//i.test(text)) throw new Error(text || 'Upload Catbox échoué');
		return text;
	}


	async copyLinks() {
		console.log(this.links);
	}


	async copyLabeledLinks(links) {
		const esc = s => s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
		const html = links.map(({ label, url }) => `<a href="${esc(url)}">${esc(label)}</a>`).join('<br>') + '<br>';
		const text = links.map(({ label, url }) => `${label} — ${url}`).join("\n");
		await navigator.clipboard.write([
			new ClipboardItem({
				'text/html': new Blob([html], { type: 'text/html' }),
				'text/plain': new Blob([text], { type: 'text/plain' })
			})
		]);
	}

}