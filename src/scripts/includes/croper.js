import DNDZone from "../librairies/dndzone";
import ImageFrame from "../librairies/imageframe";
import Notification from "../librairies/notification";


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
	browse2btn = null;
	links = null;
	
	splash = null;
	splashdnd = null;

	loader = null;

	notif = null;

	
	constructor() {
		this.container = document.querySelector('.croper');
		this.imagegroup = create('div', 'croper__images');
		this.image = create('img');
		this.imageL = this.imagegroup.create('div', 'croper__images__box box--2-3');
		this.imageR = this.imagegroup.create('div', 'croper__images__box box--5-4');
		this.imageL.title = `Utilisez la molette pour zoomer`;
		this.imageR.title = `Utilisez la molette pour zoomer`;

		this.btngroup = create('div', 'croper__button');
		this.uploadbtn = this.btngroup.create('button', null, 'Téléverser');
		this.uploadbtn.addEventListener('click', async () => this.uploadFiles());
		this.browsebtn = this.btngroup.create('button', null, 'Parcourir');
		this.browsebtn.addEventListener('click', () => this.browseFile());

		this.results = create('div', 'croper__results');
		this.results.create('div', 'croper__results__winner').title = `Tu veux-tu une médaille?`;
		this.results.create('div', 'croper__results__congrats', `Félicitations!`);
		this.results.create('div', 'croper__results__text', `Image téléversée avec succès. Il ne reste qu’à Copier les liens et les coller dans le calendrier Google.`);
		const btncont = this.results.create('div', 'croper__results__btn');
		
		this.copybtn = btncont.create('button', 'croper__results__copy', `Copier les liens`);
		this.copybtn.addEventListener('click', () => this.copyLinks());

		this.browse2btn = btncont.create('button', 'croper__results__browse', `Parcourir`);
		this.browse2btn.addEventListener('click', () => this.browseFile());

		this.splash = create('div', 'croper__splash show', `Glissez-déposez votre image ici ou<br> cliquez ici pour choisir un fichier.`);
		this.splash.addEventListener('click', () => this.browseFile());
		this.splashdnd = new DNDZone(this.splash, { onFileDrop: file => this.handleFile(file) });

		this.loader = create('div', 'croper__loader');
		this.loader.create('div', 'loading-double-circular');

		this.frameL = new ImageFrame(this.imageL, '2/3');
		this.frameR = new ImageFrame(this.imageR, '5:4');

		this.notif = new Notification;

		this.container.replaceChildren(this.imagegroup, this.btngroup, this.results, this.splash, this.loader);
	}


	handleFile(dropFile) {
        if(dropFile.type.startsWith('image/') && dropFile.size <= 5242880) {
			return this.loadImage(dropFile);
        }
    }


	browseFile() {
		return new Promise(res => {
			browse('image/*', async evt => {
				if (evt.target.files.length > 0) {
					res(this.handleFile(evt.target.files[0]));
				}
			});
		});
	}


	async loadImage(file) {
		this.image.src = URL.createObjectURL(file);
		await Promise.all([
			this.frameL.loadImage(file),
			this.frameR.loadImage(file)
		]);
		this.splash.classList.remove('show');
		this.results.classList.remove('show');
	}


	async uploadFiles() {
		this.loader.classList.add('show');
		const urlParams = new URLSearchParams(window.location.search);
		if(urlParams.get('cache') !== null) {
			console.log('Google cache: active');
			this.links = [
				"https://files.catbox.moe/zi3o0j.webp",
				"https://files.catbox.moe/71fg0x.webp",
				"https://files.catbox.moe/g3hwgs.webp"
			];
		} else {
			try {
				const blobs = await Promise.all([
					this.exportBlob(640),
					this.frameR.exportBlob(140, 'webp'),	
					this.frameL.exportBlob(280, 'webp'),
				]);
				this.links = await Promise.all([
					this.uploadBlob2(blobs[0]),
					// this.uploadBlob(blobs[1]),
					// this.uploadBlob(blobs[2]),
				]);
			} catch (err) {
				console.error(err.message || err);
			}
		}
		await sleep(1000);
		// this.results.classList.add('show');
		this.loader.classList.remove('show');
	}


	async exportBlob(outW) {
		const outH = outW * this.image.naturalHeight / this.image.naturalWidth;
		const cvs = document.createElement('canvas');
		cvs.width = outW;
		cvs.height = outH;
		const ctx = cvs.getContext('2d', { alpha: true });
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(this.image, 0, 0, this.image.naturalWidth, this.image.naturalHeight, 0, 0, outW, outH);
		return new Promise((res, rej) => cvs.toBlob(b => b ? res(b) : rej(new Error('toBlob() a échoué')), `image/webp`, 0.92));
	}


	async uploadBlob2(blob) {

		const fd = new FormData();
		fd.append('reqtype', 'fileupload');
		fd.append('fileToUpload', new File([blob], `blob.webp`, { type: blob.type }));
		const resp = await fetch('http://images.action.quebec', { headers: {'Authorization': 'Basic ' + btoa('admin:Vji.4Zd6qQ>jYq!9YDu9P35WFxvW')}, method: 'POST', body: fd });
		const text = (await resp.text()).trim();
		// if (!resp.ok || !/^https?:\/\//i.test(text)) throw new Error(text || 'Upload Catbox échoué');
		console.log(text);
		return text;


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
		await this.copyLabeledLinks([
			{ label: `image-couverture`, url: this.links[0] },
			{ label: `image-calendrier`, url: this.links[1] },
			{ label: `image-carte`,      url: this.links[2] },
		]);
		this.notif.thumbsUp('Liens copiés!');
	}


	async copyLabeledLinks(links) {
		const esc = s => s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
		const html = links.map(({ label, url }) => `<a href="${esc(url)}">${esc(label)}</a>`).join('<br>') + '<br>';
		const text = links.map(({ label, url }) => `${label} — ${url}`).join("\n");
		return navigator.clipboard.write([
			new ClipboardItem({
				'text/html': new Blob([html], { type: 'text/html' }),
				'text/plain': new Blob([text], { type: 'text/plain' })
			})
		]);
	}

}