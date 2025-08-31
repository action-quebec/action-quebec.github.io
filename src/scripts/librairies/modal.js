export default class Modal {

	container = null;
	placeholder = null;

	opts = {
		class: false,
		block: false,
		bgClick: false,
	};


	constructor(opts = {}) {
		this.opts = { ...this.opts, ...opts };
		
		this.container = document.body.create('div', 'modal');
		this.placeholder = this.container.create('div', 'modal__placeholder');
		if(this.opts.class) this.container.classList.add(this.opts.class);

		this.container.addEventListener('click', e => this.hide());

	}


	async show(elm) {
		switch(typeof elm) {
			case 'string': this.placeholder.innerHTML = elm; break;
			case 'object': this.placeholder.replaceChildren(elm); break;
			case 'array': this.placeholder.replaceChildren(...elm); break;
			default: return false;
		}
		
		// if(typeof elm == 'string') this.placeholder.innerHTML = elm;
		// if(typeof elm)

		this.container.classList.add('show');
		return true;
	}


	async hide() {
		this.container.classList.remove('show');
	}


}