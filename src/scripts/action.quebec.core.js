import './librairies/secrets';
import './librairies/helpers';
import './librairies/lightswitch';

({

	MONTHS_BACK:   6,
	MONTHS_AHEAD:  12,
	TRANSITION:    150,
	UPCOMINGS:     12,
	TIMEZONE:      'America/Toronto',
	DEFAULTPROPS:  { organisation: "ssjb", type: "citoyen" },

	secrets: null,
	options: null,
	events: null,
	notif: null,

	calendar: null,
	swipedetector: null,
	ytreplacer: null,
	swiper: null,
	modal: null,
	prec: null,
	suiv: null,

	mutexSwiper: null,
	mutexRem: null,

	payload: [],


	init: async function() {
			
		
			// let eventSet = null;
			await Promise.all([
				documentReady(() => this.initUI()),
				(new Promise(async resolve => {
					await this.loadSecrets();
					console.log(this.secrets);
					// eventSet = await this.loadGoogleCalendar();
					resolve();
				}))
			]);
	},


	loadSecrets: async function() {
		this.secrets = await SECRETS;
	},


	busy: async function(promise) {
		document.documentElement.classList.add('is-busy');	
		const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
		document.documentElement.classList.remove('is-busy');
		return typeof promise == 'array' ? results : results[0];
	},


	working: async function(promise) {
		document.documentElement.classList.add('is-working');	
		const results = await Promise.allSettled(typeof promise == 'array' ? promise : [promise]);
		document.documentElement.classList.remove('is-working');
		return typeof promise == 'array' ? results : results[0];
	},


	initUI: function() {


	},


}).init();