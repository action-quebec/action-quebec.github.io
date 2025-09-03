import DNDZone from "../librairies/dndzone";


export default class Croper {

	container = null;
	imagegroup = null;
	imageL = null;
	imageR = null;

	btngroup = null;
	uploadbtn = null;
	
	splash = null;
	splashdnd = null;

	
	constructor() {

		this.container = document.querySelector('.croper');
		this.imagegroup = create('div', 'croper__images');
		this.imageL = this.imagegroup.create('div', 'croper__images__box box--2-3');
		this.imageR = this.imagegroup.create('div', 'croper__images__box box--5-4');

		this.btngroup = create('div', 'croper__button');
		this.uploadbtn = this.btngroup.create('button', null, 'Téléverser');
		// this.uploadbtn.disabled = true;

		this.splash = create('div', 'croper__splash show', `Glissez-déposez votre image ici ou<br> cliquez ici pour choisir un fichier.`);

		this.container.replaceChildren(this.imagegroup, this.btngroup, this.splash);

		this.splashdnd = new DNDZone(this.splash, { onFileDrop: file => this.handleFile(file) });
		this.splash.addEventListener('click', e => this.browseFile(e));


	}


	async handleFile(dropFile) {
        if(dropFile.type.startsWith('image/') && dropFile.size <= 5242880) {
            const reader = new FileReader();
            reader.onload = e => {
                this.loadImage({
                    name: dropFile.name,
                    size: dropFile.size,
                    type: dropFile.type,
                    contents: e.target.result
                });
            };
            reader.readAsDataURL(dropFile);
        }
    }


	async browseFile(e) {
		browse('image/*', evt => {
			if (evt.target.files.length > 0) {
				this.handleFile(evt.target.files[0]);
			}
		});
	}


	async loadImage({ name, size, type, contents}) {
		console.log(name);







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