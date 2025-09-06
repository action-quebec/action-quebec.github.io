export default class DNDZone {

	container = null;

	opts = {
		onFileDrop: null,
	};
	
	
	constructor(container, opts = {}) {
		this.opts = { ...this.opts, ...opts };
		if(typeof container == 'string') this.container = document.querySelector(container);
		else this.container = container;
		this.container.addEventListener('dragenter', e => this.dragEnter(e));
		this.container.addEventListener('dragleave', e => this.dragLeave(e));
		this.container.addEventListener('dragover',  e => this.dragOver(e));
		this.container.addEventListener('drop',      e => this.drop(e));
	}


	async dragEnter(e) {
		e.preventDefault();
		this.container.classList.add('dragover');
	}


	async dragLeave(e) {
		this.container.classList.remove('dragover');
	}


	async dragOver(e) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}


	async drop(e) {
		e.preventDefault();
		this.container.classList.remove('dragover');
		const files = e.dataTransfer.files;
		if (files.length > 0) this.opts.onFileDrop?.(e.dataTransfer.files[0]);
	}

}