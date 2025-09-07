export default class DNDZone {

	container = null;

	opts = {
		onFileDrop: null,
	};
	
	
	constructor(container, opts = {}) {
		this.opts = { ...this.opts, ...opts };
		if(typeof container != 'string') this.container = container;
		else this.container = document.querySelector(container);
		this.container.addEventListener('dragover',  e => e.preventDefault());
		this.container.addEventListener('dragenter', e => this.dragEnter(e));
		this.container.addEventListener('dragleave', e => this.dragLeave(e));
		this.container.addEventListener('drop',      e => this.drop(e));
	}


	dragEnter(e) {
		e.preventDefault();
		this.container.classList.add('dragover');
	}


	dragLeave(e) {
		this.container.classList.remove('dragover');
	}


	async drop(e) {
		e.preventDefault();
		const files = e.dataTransfer.files;
		if (files.length > 0) await this.opts.onFileDrop?.(e.dataTransfer.files[0]);
		this.container.classList.remove('dragover');
	}

}