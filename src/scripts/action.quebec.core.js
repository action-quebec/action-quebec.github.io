import './librairies/helpers.js';
import './librairies/lightswitch.js';
import Calendar from '@toast-ui/calendar';

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


	unPays: async function () {

		await this.initCalendar();
		await loadJsonProperties(this, { secrets: '/bt1oh97j7X.json' });
		// this.loadGoogleCalendar();

		console.log('Québec un pays!');
	},


	initCalendar: async function() {
		this.calendar = new Calendar('.calendrier__container', {
			defaultView: 'month',
			isReadOnly: true,
			timezone: { zones: [{ timezoneName: TIMEZONE }] },
			usageStatistics: false,
			month: { dayNames: DAY_NAMES },
			week: { dayNames: DAY_NAMES },

			theme: {
				common: {
					saturday: { color: 'var(--cal-text)' },
					holiday:  { color: 'var(--cal-text)' },
					dayName:  { color: 'var(--cal-text)' },
					backgroundColor: 'var(--bg-alpha)',		
				},
				month: {
					holidayExceptThisMonth: { color: 'var(--cal-text-alpha)' }, // dimanches hors mois
					dayExceptThisMonth:     { color: 'var(--cal-text-alpha)' },  // tous jours hors mois
				}
			}
		});
		
		document.querySelector('.calendrier__pagination__prec > span').addEventListener('click', e => this.previous());
		document.querySelector('.calendrier__pagination__suiv > span').addEventListener('click', e => this.next());
		this.title = document.querySelector('.calendrier__pagination__cour');
		this.setTitle();
	},


	loadGoogleCalendar: async function() {
		const { timeMin, timeMax } = this.getRangeBounds();
		const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.secrets.CALENDAR_ID)}/events`);
		url.searchParams.set('key', this.secrets.GOOGLE_API_KEY);
		url.searchParams.set('supportsAttachments', 'true');
		url.searchParams.set('singleEvents', 'true');
		url.searchParams.set('orderBy', 'startTime');
		url.searchParams.set('timeMin', timeMin);
		url.searchParams.set('timeMax', timeMax);
		url.searchParams.set('timeZone', TIMEZONE);
		url.searchParams.set(
  'fields',
  'items(id,summary,description,start,end,attachments(fileId,fileUrl,title,mimeType)),summary,timeZone,updated'
);
		const res = await fetch(url.toString());
		if(!res.ok) throw new Error('Erreur API Google Calendar');
		const data = await res.json();
		console.log(data);
	},


	getRangeBounds: function(){
		const now = new Date();
		const min = new Date(now); min.setMonth(min.getMonth()-MONTHS_BACK);
		const max = new Date(now); max.setMonth(max.getMonth()+MONTHS_AHEAD);
		return { timeMin: min.toISOString(), timeMax: max.toISOString() };
	},


	setTitle: async function() {
		const date = this.calendar.getDate().toDate();
		const viewDate = date.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
		this.title.innerText = viewDate;
	},


	previous: function() {
		this.calendar.prev();
		this.setTitle();
	},

	
	next: function() {
		this.calendar.next();
		this.setTitle();
	}

};