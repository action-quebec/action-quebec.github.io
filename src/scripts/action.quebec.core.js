import './librairies/helpers.js';
import './librairies/lightswitch.js';
import Modal from './librairies/modal.js'
import PXCalendar from './librairies/pxcalendar.js';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';

const MONTHS_BACK  = 6;
const MONTHS_AHEAD = 12;
const TIMEZONE     = 'America/Toronto';

const RX_GOOGLE_CA = /^\s*(?:(?<place>(?!\d)[^,]+?),\s*)?(?<street>[^,]+?),\s*(?<city>[^,]+?),\s*(?<province>AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT|Québec|Quebec|QC\.?)(?:\s+(?<postal>[A-Z]\d[A-Z][ -]?\d[A-Z]\d))?(?:,\s*(?<country>Canada))?\s*$/iu;


window.Quebec = {

	secrets: null,
	events: null,

	swiper: null,
	modal: null,
	calendar: null,
	prec: null,
	suiv: null,


	unPays: async function () {
		await Promise.all([this.initCalendar(), loadJsonProperties(this, { secrets: 'bt1oh97j7X.json' })]);
		this.modal = new Modal({ onlyBgClick: true });
		this.loadGoogleCalendar();
	},


	initCalendar: async function() {
		this.calendar = new PXCalendar('.calendrier__container', {
			placeholder: '.calendrier__pagination__cour',
			onRenderDate: (date, elm) => this.renderEvent(date, elm),
			onClickDate: (date, elm) => this.clickEventDay(date, elm)
		});
		document.querySelector('.calendrier__pagination__prec > span').addEventListener('click', e => this.calendar.previous());
		document.querySelector('.calendrier__pagination__suiv > span').addEventListener('click', e => this.calendar.next());
	},


	loadGoogleCalendar: async function() {
		this.events = await this.queryGoogleCalendar();
		const eventSet = new Set(this.events.map(v => {
			const s = new Date(v.start);
			const d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
			return ymd(d);
		}));
		this.calendar.addEvents(eventSet);
		this.addUpcomingEvents();
		const urlParams = new URLSearchParams(window.location.search);
		const evtId = urlParams.get('id');
		if(evtId !== null) this.clickEventDay(evtId);
	},


	queryGoogleCalendar: async function() {
		const urlParams = new URLSearchParams(window.location.search);
		if(urlParams.get('cache') !== null) {
			console.log('Google cache: active');
			const cache = localStorage.getItem('lastItems');
			if(cache) return this.mapGCalEvents(JSON.parse(cache));
		}
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
			const { html, firstImage } = this.replaceImageLinks(it.description || '');
			return {
				id: it.id,
				title: it.summary || '(Sans titre)',
				start, end,
				location: it.location || null,
				raw: { htmlLink: it.htmlLink },
				description: html,
				image: firstImage,
			};
		});
	},


	replaceImageLinks: function (html) {
		const regex = /<a\s+href="(.*?)"[^>]*>image<\/a>/gi;
		let firstImage = null;
		const newHtml = html.replace(regex, (match, url, title) => {
			if (!firstImage) { firstImage = url; return ''; }
			return `<img src="${url}">`;
		});
		return { html: newHtml.replace(/^(?:\s*<br\b[^>]*>\s*)+/i, '').trimStart(), firstImage };
	},


	getEventsByDate: function(date) {
		return this.events.filter(ev => {
			const s = inTZ(ev.start, TIMEZONE);
			const e = inTZ(new Date(new Date(ev.end) - 1), TIMEZONE);
			return s <= date && date <= e;
		});
	},


	getEventsById: function(id) {
		return this.events.find(e => e.id == id);
	},


	getUpcomingEvents: function() {
		const now = Date.now();
		return this.events.filter(e => Date.parse(e.start) > now);
	},


	addUpcomingEvents: async function() {
		const events = this.getUpcomingEvents().slice(0,10);
		const placeholder = document.querySelector('.events-swiper .swiper-wrapper');

		events.forEach(evt => {
			const card = placeholder.create('div', 'swiper-slide');
			card.classList.add('event-card');
			if(evt.image) card.style.setProperty('--image', `url(${evt.image})`);
			card.create('div', 'event-card__title', evt.title);
			const formatted = new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "long", timeZone: TIMEZONE}).format(new Date(evt.start));
			card.create('div', 'event-card__date', formatted);
			card.addEventListener('click', e => this.clickEventDay(evt.id));
			card.title = evt.title;
		});

		this.swiper = new Swiper(".events-swiper", {
			modules: [Autoplay],
			slidesPerView: 3,
			spaceBetween: rem(2),
			autoHeight: false,
			preloadImages: false,
			observer: false,
			observeParents: false,
			observeSlideChildren: false,
			updateOnWindowResize: false,
			lazy: { loadPrevNext: true, loadOnTransitionStart: true },
			autoplay: { delay: 5000, disableOnInteraction: false },
		});
		
		window.addEventListener('resize', async e => {
			this.swiper.params.spaceBetween = rem(2);
			setTimeout(e => this.swiper.update(), 1);
			
		});
	},


	renderEvent: async function(date, elm) {
		const events = this.getEventsByDate(date);
		const bgimg = elm.create('div', 'pxcalendar__month__day__bgimg');
		const evtip = elm.create('div', 'pxcalendar__month__day__evtip');
		evtip.innerHTML = events.map(e => this.renderEventTip(e)).join('<hr>');
		if(events[0].image) bgimg.style.setProperty('--image-1', `url(${events[0].image})`);
		if(events.length > 1 && events[1].image) bgimg.style.setProperty('--image-2', `url(${events[1].image})`);
	},


	renderEventTip: function(evt) {
		const time = new Intl.DateTimeFormat('fr-CA', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(evt.start));
		let str = `<h3>${evt.title}</h3>`;
		if(evt.location) {
			const { city, place } = this.parseGoogleAddress(evt.location);
			if(city) {
				let addr = city;
				if(place) addr = `${place}, ${addr}`;
				str += `<strong>Où:</strong> ${addr}<br>`;
			}
		}
		str += `<strong>Quand:</strong> ${time}`;
		return str;
	},


	clickEventDay: async function(date, elm) {
		const events = /^\d{4}-\d{2}-\d{2}$/.test(date) ? this.getEventsByDate(date) : [this.getEventsById(date)];
		const eventDetails = events.map(v => this.renderEventDetails(v));
		const container = create('div', 'modal-events');
		const placeholder = container.create('div', 'modal-events__placeholder');
		const close = placeholder.create('div', 'modal-events__placeholder__close');
		const dateholder = placeholder.create('div', 'modal-events__placeholder__date');
		const placeholderEvents = placeholder.create('div', 'modal-events__placeholder__events');
		const d = new Date(`${/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : fmtDate(new Date(events[0].start))}T00:00:00`);
		const options = { weekday: "long", day: "numeric", month: "long", timeZone: TIMEZONE};
		const formatted = new Intl.DateTimeFormat("fr-CA", options).format(d).replace(/^(\w+)/, "$1 le");;
		dateholder.innerHTML = formatted;		
		close.title = 'Fermer';
		close.addEventListener('click', e => this.modal.hide());
		placeholderEvents.append(...eventDetails);
		this.modal.show(container);
	},


	renderEventDetails: function(evt) {
		const container = create('div', 'modal-events__placeholder__events__event');
		const time = this.formatLabel(evt.start);
		let str = '';
		if(evt.image) str += `<img src="${evt.image}"><br>`;
		str += `<h1>${evt.title}</h1>`;
		if(evt.location) {
			const addrparts = this.parseGoogleAddress(evt.location);
			if(addrparts.place) addr = `${addrparts.place}, ${addrparts.city}`;
			else addr = `${addrparts.street}, ${addrparts.city}`;
			const url = `https://www.google.com/maps/search/${encodeURI(evt.location)}`
			str += `<span class="label"><strong>Où:</strong> <a href="${url}" target="_blank" noopener noreferer>${addr}</a></span><br>`;
		}
		str += `<span class="label"><strong>Quand:</strong> ${time}</span><br><br>`;
		str += evt.description + `<br>EventID: ${evt.id}`;
		container.innerHTML = str;
		return container;
	},


	parseGoogleAddress: function (addr) {
		const m = addr.match(RX_GOOGLE_CA);
		if (!m) return null;
		const g = m.groups || {};
		return {
			place: g.place?.trim() || null,
			street: g.street?.trim() || null,
			city: g.city?.trim() || null,
			province: g.province?.trim() || null,
			postal: g.postal?.replace(/\s+/g, ' ') || null,
			country: g.country?.trim() || null
		};
	},


	formatLabel: function (iso, tz = TIMEZONE) {
		const d = new Date(iso);
		const datePart = new Intl.DateTimeFormat('fr-CA', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long'}).format(d);
		const timePart = new Intl.DateTimeFormat('fr-CA', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
		const time = timePart.replace(/\u202F|\u00A0/g, ' ');
		return `${datePart} ${time}`;
	},


};