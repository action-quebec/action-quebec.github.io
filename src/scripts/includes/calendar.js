import swipeElm from '../librairies/swipeelm';
import Modal from '../librairies/modal'
import PXCalendar from '../librairies/pxcalendar';
import Swiper from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';


export default class Calendar {

	MONTHS_BACK  = 6;
	MONTHS_AHEAD = 12;
	TIMEZONE     = 'America/Toronto';
	TRANSITION   = 150;

	RX_GOOGLE_CA = /^\s*(?:(?<place>(?!\d)[^,]+?),\s*)?(?<street>[^,]+?),\s*(?<city>[^,]+?),\s*(?<province>AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT|Québec|Quebec|QC\.?)(?:\s+(?<postal>[A-Z]\d[A-Z][ -]?\d[A-Z]\d))?(?:,\s*(?<country>Canada))?\s*$/iu;

	secrets = null;
	events = null;

	calendar = null;
	swiper = null;
	modal = null;
	prec = null;
	suiv = null;

	mutexSwiper = null;
	mutexRem = null;

	payload = [];


	constructor() {
		this.busy(new Promise(res => {
			this.modal = new Modal({ onlyBgClick: true });
			Promise.all([this.initCalendar(), loadJsonProperties(this, { secrets: atob('L2J0MW9oOTdqN1guanNvbg==') })]).then(async () => {
				const eventSet = await this.loadGoogleCalendar();
				Promise.all([
					this.calendar.addEvents(eventSet),
					this.addUpcomingEvents(),
					this.initParams()
				]).then(res);
			});
		})).then(() => this.processPayload());
	}


	async busy(promise) {
		document.documentElement.classList.add('is-busy');	
		const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
		document.documentElement.classList.remove('is-busy');
		return typeof promise == 'array' ? results : results[0];
	}


	async working(promise) {
		document.documentElement.classList.add('is-working');	
		const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
		document.documentElement.classList.remove('is-working');
		return typeof promise == 'array' ? results : results[0];
	}


	async initParams() {
		const evtId = (new URLSearchParams(window.location.search))?.get('id');
		if(evtId) {
			const event = this.getEventById(evtId);
			if(event) {
				await this.calendar.setMonth(ymd(new Date(event.start)));
				await this.clickEventDay(event.id);
			}
		}
	}


	async initCalendar() {
		this.calendar = new PXCalendar('.calendar__container', {
			placeholder: '.calendar__pagination__current',
			onRenderDate: (date, elm) => this.renderEvent(date, elm),
			onClickDate: (date) => this.clickEventDay(date)
		});
		document.querySelector('.calendar__pagination__prev > span').addEventListener('click', () => this.previousMonth());
		document.querySelector('.calendar__pagination__next > span').addEventListener('click', () => this.nextMonth());
		const elm = document.querySelector('.calendar__container');
		swipeElm(elm, {
			threshold: Math.min(40, Math.max(10, elm.clientWidth * 0.01)),
			maxTime: 500,
			axis: 'x',
			onSwipeLeft:  () => this.nextMonth(),
			onSwipeRight: () => this.previousMonth(),
		});
	}


	async loadGoogleCalendar() {
		this.events = await this.queryGoogleCalendar();
		return new Set(await Promise.all(this.events.map(async v => {
			const s = new Date(v.start);
			const d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
			return ymd(d);
		})));
	}


	async queryGoogleCalendar() {
		if((new URLSearchParams(window.location.search))?.get('cache') !== null) {
			console.log('Google cache: active');
			const cache = localStorage.getItem('lastItems');
			if(cache) return this.mapGCalEvents(JSON.parse(cache));
		}
		const { timeMin, timeMax } = this.getRangeBounds();
		const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.secrets.CALENDAR_ID)}/events`);
		url.searchParams.set('key', this.secrets.GOOGLE_API_KEY);
		url.searchParams.set('singleEvents', 'true');
		url.searchParams.set('orderBy', 'startTime');
		url.searchParams.set('timeMin', timeMin);
		url.searchParams.set('timeMax', timeMax);
		url.searchParams.set('timeZone', this.TIMEZONE);
		const res = await fetch(url.toString());
		if(!res.ok) throw new Error('Erreur API Google Calendar');
		const data = await res.json();
		localStorage.setItem('lastItems', JSON.stringify(data.items ?? []));
		return this.mapGCalEvents(data.items ?? []);
	}


	getRangeBounds() {
		const now = new Date();
		const min = new Date(now);
		const max = new Date(now);
		min.setMonth(min.getMonth() - this.MONTHS_BACK);
		max.setMonth(max.getMonth() + this.MONTHS_AHEAD);
		return { timeMin: min.toISOString(), timeMax: max.toISOString() };
	}


	mapGCalEvents(items) {
		return Promise.all(items.filter(it => it.status !== 'cancelled').map(async it => {
			const allDay = !!(it.start && it.start.date);
			const start = allDay ? fmtDate(new Date(it.start.date)) : isoLocal(it.start.dateTime || it.start);
			const end = allDay ? fmtDate(new Date(it.end.date)) : isoLocal(it.end.dateTime || it.end);
			let { html, tags } = this.extractLink(it.description || '', ['image-couverture', 'image-calendrier', 'image-carte']);
			let { newHtml, firstImage } = this.replaceImageLinks(html);
			tags['image-couverture'] = tags['image-couverture'] || firstImage || null;
			tags['image-calendrier'] = tags['image-calendrier'] || tags['image-couverture'];
			tags['image-carte'] = tags['image-carte'] || tags['image-couverture'];
			firstImage = tags['image-couverture'] || firstImage;
			return {
				id: it.id,
				title: it.summary || '(Sans titre)',
				start, end,
				location: it.location || null,
				raw: { htmlLink: it.htmlLink },
				description: newHtml,
				image: firstImage,
				images: tags
			};
		}));
	}


	extractLink(html, tags = []) {
		const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const objTags = Object.fromEntries(tags.map(t => [t, null]));
		const newHtml = tags.reduce((str, tag) => {
			const re = new RegExp(`<a\\s+href=(["'])(.*?)\\1[^>]*>${escapeRegExp(tag)}<\\/a>`, 'gi');
			return str.replace(re, (_m, _q, url) => {
				objTags[tag] = url;
				return '';
			});
		}, html);
		return { html: newHtml.replace(/^(?:\s*<br\b[^>]*>\s*)+/i, '').trimStart(), tags: objTags }
	}


	replaceImageLinks(html) {
		const regex = /<a\b(?=[^>]*\bhref=(['"])([^"'<>]+)\1)[^>]*>\s*image\s*<\/a>/gi;
		let firstImage = null;
		const newHtml = html.replace(regex, (_m, _q, url) => {
			if (!firstImage) firstImage = url;
			return `<img src="${url}">`;
		});
		return { newHtml, firstImage };
	}


	async renderEvent(date, elm) {
		const events = this.getEventsByDate(date);
		const bgimg = elm.create('div', 'pxcalendar__month__day__bgimg');
		const evtip = elm.create('div', 'pxcalendar__month__day__evtip');
		const evtipCont = evtip.create('div', 'pxcalendar__month__day__evtip__cont');
		evtipCont.innerHTML = (await Promise.all(events.map(async e => this.renderEventTip(e)))).join('<hr>');
		const imgs = [];
		if(events[0].image) {
			imgs.push(preloadImage(events[0].images['image-calendrier']));
			bgimg.style.setProperty('--image-1', `url(${events[0].images['image-calendrier']})`);
		}
		if(events.length > 1 && events[1].image) {
			imgs.push(preloadImage(events[1].images['image-calendrier']));
			bgimg.style.setProperty('--image-2', `url(${events[1].images['image-calendrier']})`);
		}
		events.forEach(e => this.payload.push(e.images['image-couverture']));
		return Promise.allSettled(imgs);
	}


	getEventsByDate(date) {
		return this.events.filter(ev => {
			const s = inTZ(ev.start, this.TIMEZONE);
			const e = inTZ(new Date(new Date(ev.end) - 1), this.TIMEZONE);
			return s <= date && date <= e;
		});
	}


	getEventById(id) {
		return this.events.find(e => e.id == id);
	}


	getUpcomingEvents() {
		const now = Date.now();
		return this.events.filter(e => Date.parse(e.start) > now);
	}


	renderEventTip(evt) {
		const time = new Intl.DateTimeFormat('fr-CA', { timeZone: this.IMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(evt.start));
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
	}


	parseGoogleAddress(addr) {
		const m = addr.match(this.RX_GOOGLE_CA);
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
	}


	addUpcomingEvents() {
		const preloads = [];
		const events = this.getUpcomingEvents().slice(0,10);
		const placeholder = document.querySelector('.events-swiper .swiper-wrapper');
		const evtRender = Promise.all(events.map(async evt => {
			const card = placeholder.create('div', 'swiper-slide');
			card.classList.add('event-card');
			if(evt.image) {
				this.payload.push(evt.images['image-couverture']);
				preloads.push(preloadImage(evt.images['image-carte']));
				card.style.setProperty('--image', `url(${evt.images['image-carte']})`);
			}
			card.create('div', 'event-card__title', evt.title);
			const formatted = new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "long", timeZone: this.TIMEZONE}).format(new Date(evt.start));
			card.create('div', 'event-card__date', formatted);
			card.addEventListener('click', e => this.clickEventDay(evt.id));
			card.title = evt.title;
		}));
		const swipRender = new Promise(res => {
			this.swiper = new Swiper('.events-swiper', {
				modules: [Autoplay, Navigation],
				slidesPerView: 3,
				spaceBetween: rem(2),
				allowTouchMove: true,
				autoHeight: false,
				preloadImages: false,
				observer: false,
				observeParents: false,
				observeSlideChildren: false,
				updateOnWindowResize: false,
				preventClicks: true,
      			preventClicksPropagation: true,
				lazy: { loadPrevNext: true, loadOnTransitionStart: true },
				autoplay: { delay: 5000, disableOnInteraction: false },
				navigation: { nextEl: '.events-swiper-next', prevEl: '.events-swiper-prev' },
			});
			res();
		});
		window.addEventListener('resize', () => {
			if (this.mutexSwiper != null) return;
			const mutexRem = Number(Math.round(rem(2) + 'e+2') + 'e-2');
			if(mutexRem != this.swiper.params.spaceBetween) {
				this.mutexSwiper = requestAnimationFrame(() => {
					this.swiper.params.spaceBetween = mutexRem;
					this.swiper.update();
					this.mutexSwiper = null;
				});
			}
		});
		return Promise.all([swipRender, evtRender, ...preloads]);
	}


	clickEventDay(date) {
		return this.working(new Promise(async res => {
			const events = /^\d{4}-\d{2}-\d{2}$/.test(date) ? this.getEventsByDate(date) : [this.getEventById(date)];
			const eventDetails = (await Promise.allSettled(events.map(async v => this.renderEventDetails(v)))).filter(r => r.status === 'fulfilled').map(r => r.value);
			const container = create('div', 'modal-events');
			const placeholder = container.create('div', 'modal-events__placeholder');
			const close = placeholder.create('div', 'modal-events__placeholder__close');
			const dateholder = placeholder.create('div', 'modal-events__placeholder__date');
			const placeholderEvents = placeholder.create('div', 'modal-events__placeholder__events');
			const d = new Date(`${/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : fmtDate(new Date(events[0].start))}T00:00:00`);
			const options = { weekday: "long", day: "numeric", month: "long", timeZone: this.TIMEZONE};
			dateholder.innerHTML = new Intl.DateTimeFormat("fr-CA", options).format(d).replace(/^(\w+)/, "$1 le");
			close.title = 'Fermer';
			close.addEventListener('click', e => this.modal.hide());
			placeholderEvents.append(...eventDetails);
			this.modal.show(container).then(res);
		}));
	}


	renderEventDetails(evt) {
		const container = create('div', 'modal-events__placeholder__events__event');
		const time = this.formatLabel(evt.start);
		let str = '';
		if(evt.image) str += `<img src="${evt.image}"><br>`;
		str += `<h1>${evt.title}</h1>`;
		if(evt.location) {
			let addr = null;
			const addrparts = this.parseGoogleAddress(evt.location);
			if(addrparts.place) addr = `${addrparts.place}, ${addrparts.city}`;
			else addr = `${addrparts.street}, ${addrparts.city}`;
			const url = `https://www.google.com/maps/search/${encodeURI(evt.location)}`
			str += `<span class="label"><strong>Où:</strong> <a href="${url}" target="_blank" noopener noreferer>${addr}</a></span><br>`;
		}
		str += `<span class="label"><strong>Quand:</strong> ${time}</span><br><br>`;
		str += evt.description + `<br>EventID: ${evt.id}`;
		container.innerHTML = str;
		if(!evt.image) return container;
		return new Promise(res => preloadImage(evt.image).then(() => res(container)));
	}


	formatLabel(iso, tz = this.TIMEZONE) {
		const d = new Date(iso);
		const datePart = new Intl.DateTimeFormat('fr-CA', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long'}).format(d);
		const timePart = new Intl.DateTimeFormat('fr-CA', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
		const time = timePart.replace(/\u202F|\u00A0/g, ' ');
		return `${datePart} ${time}`;
	}


	async nextMonth() {
		return this.working(new Promise(async res => {
			this.calendar.parent.parentElement.style.overflow = 'hidden';
			await this.calendar.parent.animate([{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }], { duration: this.TRANSITION, easing: "ease-in", fill: "forwards" }).finished;
			const render = this.calendar.next();
			await this.calendar.parent.animate([{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], { duration: this.TRANSITION, easing: "ease-out", fill: "forwards" }).finished;
			this.calendar.parent.parentElement.style.overflow = '';
			this.processPayload();
			res(render);
		}));
	}


	async previousMonth() {
		return this.working(new Promise(async res => {
			this.calendar.parent.parentElement.style.overflow = 'hidden';
			await this.calendar.parent.animate([{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], { duration: this.TRANSITION, easing: "ease-in", fill: "forwards" }).finished;
			const render = this.calendar.previous();
			await this.calendar.parent.animate([{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }], { duration: this.TRANSITION, easing: "ease-out", fill: "forwards" }).finished;
			this.calendar.parent.parentElement.style.overflow = '';
			this.processPayload();
			res(Promise.all([render]));
		}));
	}


	processPayload() {
		const payload = this.payload.filter(v => v != null).map(v => preloadImage(v));
		this.payload = [];
		return Promise.allSettled(payload);
	}

}