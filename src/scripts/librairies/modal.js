export default class Modal {

	container = null;
	placeholder = null;
	duration = null;

	opened = false;

	opts = {
		class: false,
		lock: false,
		onlyBgClick: false,
	};

	
	constructor(opts = {}) {
		this.opts = { ...this.opts, ...opts };
		this.container = document.body.create('div', 'modal');
		this.duration = parseInt(getComputedStyle(this.container).getPropertyValue('--transition-duration').replace(/^[^\d]*(\d+).*$/, '$1'));
		this.placeholder = this.container.create('div', 'modal__placeholder');
		if(this.opts.class) this.container.classList.add(this.opts.class);
		if(!this.opts.lock) this.container.addEventListener('click', e => this.click(e));
		document.addEventListener('keydown', evt => { if(this.opened && (evt.key === 'Escape' && !(evt.ctrlKey || evt.altKey || evt.shiftKey))) this.hide(); });
	}


	click(evt) {
		if(!this.opts.onlyBgClick || evt.target.classList.contains('modal') || evt.target.classList.contains('modal__placeholder')) {
			this.hide();
		}
	}


	show(elm) {
		return new Promise(res => {
			switch(typeof elm) {
				case 'string': this.placeholder.innerHTML = elm; break;
				case 'object': this.placeholder.replaceChildren(elm); break;
				case 'array': this.placeholder.replaceChildren(...elm); break;
				default: return res(false);
			}
			this.container.classList.add('show');
			setTimeout(() => res(this.opened = true), this.duration);
		});
	}


	hide() {
		return new Promise(res => {
			this.container.classList.remove('show');
			setTimeout(() => {
				this.placeholder.replaceChildren([]);
				res(!(this.opened = false));
			}, this.duration);
		});
	}

}