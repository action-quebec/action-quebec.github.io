import DNDZone from "../librairies/dndzone";
import ImageFrame from "../librairies/imageframe";


export default class Croper {

	container = null;
	imagegroup = null;
	imageL = null;
	imageR = null;

	frameL = null;
	frameR = null;

	btngroup = null;
	uploadbtn = null;
	
	splash = null;
	splashdnd = null;

	loader = null;

	
	constructor() {

		this.container = document.querySelector('.croper');
		this.imagegroup = create('div', 'croper__images');
		this.imageL = this.imagegroup.create('div', 'croper__images__box box--2-3');
		this.imageR = this.imagegroup.create('div', 'croper__images__box box--5-4');
		this.btngroup = create('div', 'croper__button');
		this.uploadbtn = this.btngroup.create('button', null, 'Téléverser');
		this.splash = create('div', 'croper__splash show', `Glissez-déposez votre image ici ou<br> cliquez ici pour choisir un fichier.`);
		this.splashdnd = new DNDZone(this.splash, { onFileDrop: file => this.handleFile(file) });
		this.splash.addEventListener('click', e => this.browseFile(e));

		this.loader = create('div', 'croper__loader');
		this.loader.create('div', 'loading-double-circular');

		this.frameL = new ImageFrame(this.imageL, '2/3');
		this.frameR = new ImageFrame(this.imageR, '5:4');

		this.container.replaceChildren(this.imagegroup, this.btngroup, this.splash, this.loader);

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
		this.frameL.loadImage(file);
		this.frameR.loadImage(file);
		this.splash.classList.remove('show');
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