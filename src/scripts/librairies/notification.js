export default class Notification {

	elm = null;
	timeout = null;

	constructor() {
		this.elm = document.body.create('div', 'notification');
	}


	thumbsUp(text) {
		this.show(text, 'thumbsup');
	}


	show(text, className) {
		this.elm.innerHTML = text;
		this.elm.className = `notification ${className} show`;
		if(this.timeout) clearTimeout(this.timeout);
		this.timeout = setTimeout(() => {
			this.elm.className = `notification`;
			this.timeout = null;
		}, 3000);
	}

}