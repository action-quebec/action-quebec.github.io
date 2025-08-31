import './librairies/helpers.js';
import './librairies/lightswitch.js';
import Calendar from './librairies/calendar.js';

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const TIMEZONE = 'America/Toronto';
const MONTHS_BACK = 6;
const MONTHS_AHEAD = 12;


window.Quebec = {

	secrets: null,
	
	prec: null,
	suiv: null,
	title: null,
	calendar: null,

	dates: [],


	unPays: async function () {
		await Promise.all([
			this.initCalendar(),
			loadJsonProperties(this, { secrets: '/bt1oh97j7X.json' })
		]);
		
		// this.loadGoogleCalendar();

		console.log('Québec un pays!');
	},


	initCalendar: async function() {
		this.calendar = new Calendar('.calendrier__container');

		
		document.querySelector('.calendrier__pagination__prec > span').addEventListener('click', e => this.previous());
		document.querySelector('.calendrier__pagination__suiv > span').addEventListener('click', e => this.next());
		this.title = document.querySelector('.calendrier__pagination__cour');
		// this.setTitle();

	},


	queryGoogleCalendar: async function() {
		const cache = localStorage.getItem('lastItems');
		if(cache) return JSON.parse(cache);
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
		const items = await this.mapGCalToTuiEvents(data.items ?? []);
		localStorage.setItem('lastItems', JSON.stringify(items));
		return items;
	},


};