import DNDZone from "../librairies/dndzone";
import ImageFrame from "../librairies/imageframe";
import Notification from "../librairies/notification";


export default class Croper {

	API_ENDPOINT = 'https://images.action.quebec';

	secrets = null;
	options = null;

	container = null;
	selorg = null;
	seltype = null;

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
		
		const selgroup = this.imagegroup.create('div', 'croper__images__options');
		
		this.selorg = selgroup.create('select');
		this.selorg.required = true;
		this.selorg.create('option', null, '-- Organisation --').value = '';
		this.selorg.addEventListener('change', () => this.changeSel());

		this.seltype = selgroup.create('select');
		this.seltype.required = true;
		this.seltype.create('option', null, '-- Type --').value = '';
		this.seltype.addEventListener('change', () => this.changeSel());

		this.image = create('img');
		this.imageL = this.imagegroup.create('div', 'croper__images__box box--2-3');
		this.imageR = this.imagegroup.create('div', 'croper__images__box box--5-4');
		this.imageL.title = `Utilisez la molette pour zoomer`;
		this.imageR.title = `Utilisez la molette pour zoomer`;

		this.btngroup = create('div', 'croper__button');
		this.uploadbtn = this.btngroup.create('button', null, 'Téléverser');
		this.uploadbtn.addEventListener('click', () => this.uploadFiles());
		this.browsebtn = this.btngroup.create('button', null, 'Parcourir');
		this.browsebtn.addEventListener('click', () => this.browseFile());

		this.results = create('div', 'croper__results');
		this.results.create('div', 'croper__results__winner').title = `Tu veux-tu une médaille?`;
		this.results.create('div', 'croper__results__congrats', `Félicitations!`);
		this.results.create('div', 'croper__results__text', `Image téléversée avec succès. Il ne reste qu’à copier les liens et les coller dans la description de votre événement.`);
		const btncont = this.results.create('div', 'croper__results__btn');
		
		this.copybtn = btncont.create('button', 'croper__results__copy', `Copier les liens`);
		this.copybtn.addEventListener('click', () => this.copyLinks());

		this.browse2btn = btncont.create('button', 'croper__results__browse', `Parcourir`);
		this.browse2btn.addEventListener('click', () => this.browseFile());

		this.splash = create('div', 'croper__splash show', `Glissez-déposez votre image ici ou<br> cliquez ici pour choisir un fichier.`);
		this.splash.addEventListener('click', () => this.browseFile());
		this.splashdnd = new DNDZone(this.splash, { onFileDrop: file => this.drop(file) });

		this.loader = create('div', 'croper__loader');
		this.loader.create('div', 'loading-double-circular');

		this.frameL = new ImageFrame(this.imageL, '2/3');
		this.frameR = new ImageFrame(this.imageR, '5:4');

		this.notif = new Notification;

		this.container.replaceChildren(this.imagegroup, this.btngroup, this.results, this.splash, this.loader);

		loadJsonProperties(this, {
			secrets: atob('L2J0MW9oOTdqN1guanNvbg=='),
			options: '/options.json'
		}).then(() => {
			this.options.organisations.forEach(org => this.selorg.create('option', null, org.name).value = org.slug );
			this.options.types.forEach(type => this.seltype.create('option', null, type.name).value = type.slug );
			this.selorg.value = localStorage.getItem('selorg') ?? '';
			this.seltype.value = localStorage.getItem('seltype') ?? '';
			this.changeSel();
		});
	}


	async busy(promise) {
		document.documentElement.classList.add('is-busy');	
		const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
		document.documentElement.classList.remove('is-busy');
		return typeof promise == 'array' ? results : results[0];
	}


	async working(promise) {
		document.documentElement.classList.add('is-working');	
		const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
		document.documentElement.classList.remove('is-working');
		return typeof promise == 'array' ? results : results[0];
	}


	async changeSel() {
		this.uploadbtn.disabled = !(this.selorg.value && this.seltype.value);
		localStorage.setItem('selorg', this.selorg.value);
		localStorage.setItem('seltype', this.seltype.value);
	}


	handleFile(dropFile) {
		return new Promise((res, rej) => {
			if(dropFile.type.startsWith('image/') && dropFile.size <= 5242880) res(this.loadImage(dropFile));
			else rej("Fichier rejeté");
		});
    }


	async browseFile() {
		browse('image/*').then(async file => {
			await this.handleFile(file);
		}).catch(e => this.notif.error("Fichier rejeté"));
	}


	drop(file) {
		this.handleFile(file).catch(e => this.notif.error(e)); 
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
		return this.working(new Promise(async (res, rej) => {
			await new Promise(requestAnimationFrame);
			this.loader.classList.add('show');
			try {
				this.links = await Promise.all([
					this.uploadBlob(this.exportBlob(640)),
					this.uploadBlob(this.frameR.exportBlob(140)),
					this.uploadBlob(this.frameL.exportBlob(280)),
				]);
				await sleep(2000);
				await new Promise(requestAnimationFrame);
				this.results.classList.add('show');
				this.loader.classList.remove('show');
				res();
			} catch(err) {
				await sleep(1000);
				await new Promise(requestAnimationFrame);
				this.loader.classList.remove('show');
				this.notif.error("Échec de téléversement");
				rej();
			}
		}));
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


	async uploadBlob(blobPromise) {
		const form = new FormData();
		form.append('image', new File([await blobPromise], `image.webp`, { type: 'image/webp' }));
		const options = { headers: {'Authorization': `Bearer ${this.secrets.IMAGE_API_KEY}`}, method: 'POST', body: form };
		const resp = await fetch(this.API_ENDPOINT, options);
		const text = (await resp.text()).trim();
		if (!resp.ok || !/^https?:\/\//i.test(text)) throw new Error(text || 'Téléversement échoué');
		return text;
	}


	copyLinks() {
		this.copyLabeledLinks([
			{ label: `image-couverture`, url: this.links[0] },
			{ label: `image-calendrier`, url: this.links[1] },
			{ label: `image-carte`,      url: this.links[2] },
		], [
			{ label: `organisation`, value: this.selorg.value },
			{ label: `type`,         value: this.seltype.value },
		]).then(() => this.notif.thumbsUp('Liens copiés!'));
	}


	copyLabeledLinks(links, props) {
		const esc = s => s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
		let html = props.map(({ label, value }) => `@${label}: ${value}`).join("<br>") + "<br>";
		let text = props.map(({ label, value }) => `@${label}: ${value}`).join("\n") + "\n";
		html += links.map(({ label, url }) => `<a href="${esc(url)}">${esc(label)}</a>`).join('<br>');
		text += links.map(({ label, url }) => `${label} — ${url}`).join("\n") + "\n";
		html += `<p>Plus de détails à venir...</p>`;
		return navigator.clipboard.write([
			new ClipboardItem({
				'text/html': new Blob(['<p>' + html + '</p>'], { type: 'text/html' }),
				'text/plain': new Blob([text], { type: 'text/plain' })
			})
		]);
	}

}