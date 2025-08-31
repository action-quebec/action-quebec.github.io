export default class PXCalendar {

	MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
	WEEKDAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];


	parent = null;
	container = null;
	label = null;
	month = null;

	current = null;
	events = null;

	opts = {
		placeholder: false,
		onRenderDate: false,

	};


	constructor(selector, opts = {}) {
		this.opts = { ...this.opts, ...opts};
		this.events = new Set();
		this.current = new Date();
		this.parent = document.querySelector(selector);
		this.label = this.opts.placeholder ? document.querySelector(this.opts.placeholder) : null;
		this.container = this.parent.create('div', 'pxcalendar');
		const daynames = this.container.create('div', 'pxcalendar__daynames');
		this.WEEKDAY_NAMES.forEach(v => daynames.create('div', 'pxcalendar__daynames__name', v));
		this.month = this.container.create('div', 'pxcalendar__month');
		this.render();
	}


	async render() {
		const firstOfMonth = new Date(this.current.getFullYear(), this.current.getMonth(), 1);
		const gridStart = startOfWeek(firstOfMonth, 0);
		const cells = [];
		for(let i = 0; i < 42; i++) {
			const d = addDays(gridStart, i);
			const isOutside = d.getMonth() !== this.current.getMonth();
			const iso = ymd(d);
			const isToday = iso === ymd(new Date());
			const hasEvent = this.events.has(iso);
			const cell = create('div', 'pxcalendar__month__day', `<span>${d.getDate()}</span>`);
			if(isOutside) cell.classList.add('outside');
			if(hasEvent) cell.classList.add('has-event');
			if(isToday) cell.classList.add('today');
			if(hasEvent && this.opts.onRenderDate) this.opts.onRenderDate(iso, cell);
			cells.push(cell);
		}
		this.month.replaceChildren(...cells);
		if(this.label) this.label.innerText = `${this.MONTH_NAMES[this.current.getMonth()]} ${this.current.getFullYear()}`;
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


}