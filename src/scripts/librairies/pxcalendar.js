export default class PXCalendar {

	MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
	WEEKDAY_NAMES = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

	parent = null;
	container = null;
	label = null;
	month = null;

	current = null;
	events = null;

	opts = {
		placeholder: null,
		onRenderDate: null,
		onClickDate: null,
	};


	constructor(selector, opts = {}) {
		this.events = new Set();
		this.current = new Date();
		this.opts = { ...this.opts, ...opts };
		this.parent = document.querySelector(selector);
		this.label = this.opts.placeholder ? document.querySelector(this.opts.placeholder) : null;
		this.container = this.parent.create('div', 'pxcalendar');
		const daynames = this.container.create('div', 'pxcalendar__daynames');
		this.WEEKDAY_NAMES.forEach(v => daynames.create('div', 'pxcalendar__daynames__name', v));
		this.month = this.container.create('div', 'pxcalendar__month');
		this.render();
	}


	async render() {
		const tipTranslations = [];
		const firstOfMonth = new Date(this.current.getFullYear(), this.current.getMonth(), 1);
		const gridStart = startOfWeek(firstOfMonth, 0);
		const cells = [];
		for(let i = 0; i < 42; i++) {
			const d = addDays(gridStart, i);
			const iso = ymd(d);
			const cell = create('div', 'pxcalendar__month__day', `<span>${d.getDate()}</span>`);
			if(d.getMonth() !== this.current.getMonth()) cell.classList.add('outside');
			if(iso === ymd(new Date())) cell.classList.add('today');
			if(this.events.has(iso)) {
				cell.classList.add('has-event');
				this.opts.onRenderDate?.(iso, cell);
				cell.addEventListener('click', e => this.opts.onClickDate?.(iso, cell));
			}
			cells.push(cell);
		}
		this.month.replaceChildren(...cells);
		if(this.label) {
			const monthText = `${this.MONTH_NAMES[this.current.getMonth()]} ${this.current.getFullYear()}`;
			this.label.innerText = monthText;
			this.label.title = monthText;
		}
	}


	async addEvents(events) {
		this.events = new Set([...this.events, ...events]);
		this.render();
	}


	async next() {
		this.current = new Date(this.current.getFullYear(), this.current.getMonth() + 1, 1);
		this.render();
	}


	async previous() {
		this.current = new Date(this.current.getFullYear(), this.current.getMonth() - 1, 1);
		this.render();
	}


	async setMonth(date) {
		const d = new Date(date);
		this.current = new Date(d.getFullYear(), d.getMonth(), 1);
		this.render();
	}


}