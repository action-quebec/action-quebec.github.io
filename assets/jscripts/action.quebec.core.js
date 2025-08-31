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

	dates: [],


	unPays: async function () {
		await Promise.all([
			// this.initCalendar(),
			loadJsonProperties(this, { secrets: '/bt1oh97j7X.json' })
		]);
		
		// this.loadGoogleCalendar();

		console.log('Québec un pays!');
	},


	initCalendar: async function() {
		this.calendar = new Calendar('.calendrier__container', {
			id: 'action',
			defaultView: 'month',
			isReadOnly: true,
			timezone: { zones: [{ timezoneName: TIMEZONE }] },
			usageStatistics: false,
			month: {
				dayNames: DAY_NAMES,
				gridSelection: { enableClick: true }
			},
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
			},
  template: {
    // monthDay: (day) => day.date,    // tu gardes juste la date
    monthGridHeaderExceed: () => '', // supprime le compteur "+n"
    // monthDayName: (day) => day.dayName
  },
  eventRenderer: () => null, // ⚡ ne rend aucun bloc dans layer events
  
		});
		
		document.querySelector('.calendrier__pagination__prec > span').addEventListener('click', e => this.previous());
		document.querySelector('.calendrier__pagination__suiv > span').addEventListener('click', e => this.next());
		this.title = document.querySelector('.calendrier__pagination__cour');
		this.setTitle();

	},


	loadGoogleCalendar: async function() {
		try {
			const items = await this.queryGoogleCalendar();
			items.forEach(item => {
				const day = item.start.slice(0, 10);
				if(this.dates[day] == undefined) this.dates[day] = { date: day, events: [], event: { id: day, title: day, calendarId: 'action', category: 'allday', start: day,end: day }};
				this.dates[day].events.push(item);
			});
			const events = Object.entries(this.dates).map(([k, v]) => v.event);
			await this.calendar.createEvents(events);
			

		} catch(e) {
			console.error(e);
		};

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


	mapGCalToTuiEvents: async function (items) {
		return (items || [])
			.filter(it => it.status !== 'cancelled')
			.map(it => {
				const allDay = !!(it.start && it.start.date);
				const start = allDay ? fmtDate(new Date(it.start.date)) : isoLocal(it.start.dateTime || it.start);
				const end = allDay ? fmtDate(new Date(it.end.date)) : isoLocal(it.end.dateTime || it.end);
				return {
					id: it.id,
					calendarId: 'action',
					title: it.summary || '(Sans titre)',
					category: allDay ? 'allday' : 'time',
					start, end,
					location: it.location || '',
					raw: { htmlLink: it.htmlLink },
					description: it.description || '',
				};
			});
	},


	getRangeBounds: function(){
		const now = new Date();
		const min = new Date(now);
		const max = new Date(now); 
		min.setMonth(min.getMonth() - MONTHS_BACK);
		max.setMonth(max.getMonth() + MONTHS_AHEAD);
		return { timeMin: min.toISOString(), timeMax: max.toISOString() };
	},


	setTitle: async function() {
		const date = this.calendar.getDate().toDate();
		const viewDate = date.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
		this.title.innerText = viewDate;
	},


	previous: async function() {
		this.calendar.prev();
		this.setTitle();
	},

	
	next: async function() {
		this.calendar.next();
		this.setTitle();
	}

};