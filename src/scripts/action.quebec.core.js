import './librairies/helpers.js';
import './librairies/lightswitch.js';
import PXCalendar from './librairies/pxcalendar.js';

const TIMEZONE = 'America/Toronto';
const MONTHS_BACK = 6;
const MONTHS_AHEAD = 12;


window.Quebec = {

	secrets: null,
	
	prec: null,
	suiv: null,
	title: null,
	calendar: null,

	events: null,


	unPays: async function () {
		await Promise.all([
			loadJsonProperties(this, { secrets: '/bt1oh97j7X.json' }),
			this.initCalendar()
		]);
		
		this.loadGoogleCalendar();

		console.log('Québec un pays!');
	},


	initCalendar: async function() {
		this.calendar = new PXCalendar('.calendrier__container', {
			placeholder: '.calendrier__pagination__cour',
			onRenderDate: (date, elm) => this.renderEvent(date, elm)
		});
		document.querySelector('.calendrier__pagination__prec > span').addEventListener('click', e => this.calendar.previous());
		document.querySelector('.calendrier__pagination__suiv > span').addEventListener('click', e => this.calendar.next());
		this.title = document.querySelector('.calendrier__pagination__cour');
	},


	loadGoogleCalendar: async function() {
		this.events = await this.queryGoogleCalendar();
		const eventSet = new Set(this.events.map(v => {
			const s = new Date(v.start);
			const d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
			return ymd(d);
		}));
		this.calendar.addEvents(eventSet);
	},


	queryGoogleCalendar: async function() {
		const cache = localStorage.getItem('lastItems');
		if(cache) return this.mapGCalEvents(JSON.parse(cache));
		const { timeMin, timeMax } = this.getRangeBounds();
		const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.secrets.CALENDAR_ID)}/events`);
		url.searchParams.set('key', this.secrets.GOOGLE_API_KEY);
		url.searchParams.set('supportsAttachments', 'true');
		url.searchParams.set('singleEvents', 'true');
		url.searchParams.set('orderBy', 'startTime');
		url.searchParams.set('timeMin', timeMin);
		url.searchParams.set('timeMax', timeMax);
		url.searchParams.set('timeZone', TIMEZONE);
		const res = await fetch(url.toString());
		if(!res.ok) throw new Error('Erreur API Google Calendar');
		const data = await res.json();
		localStorage.setItem('lastItems', JSON.stringify(data.items ?? []));
		return this.mapGCalEvents(data.items ?? []);
	},


	getRangeBounds: function(){
		const now = new Date();
		const min = new Date(now);
		const max = new Date(now); 
		min.setMonth(min.getMonth() - MONTHS_BACK);
		max.setMonth(max.getMonth() + MONTHS_AHEAD);
		return { timeMin: min.toISOString(), timeMax: max.toISOString() };
	},


	mapGCalEvents: function (items) {
		return items.filter(it => it.status !== 'cancelled').map(it => {
			const allDay = !!(it.start && it.start.date);
			const start = allDay ? fmtDate(new Date(it.start.date)) : isoLocal(it.start.dateTime || it.start);
			const end = allDay ? fmtDate(new Date(it.end.date)) : isoLocal(it.end.dateTime || it.end);
			return {
				id: it.id,
				title: it.summary || '(Sans titre)',
				start, end,
				location: it.location || '',
				raw: { htmlLink: it.htmlLink },
				description: it.description || '',
			};
		});
	},


	getEventsByDate: function(date) {
		return this.events.filter(ev => {
			const s = inTZ(ev.start);
			const e = inTZ(new Date(new Date(ev.end) - 1));
			return s <= date && date <= e;
		});
	},


	renderEvent: async function(date, elm) {
		const events = this.getEventsByDate(date);
		events.forEach(v => {
			console.log(v);
		});


		// console.log(events);
	},


};