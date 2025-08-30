import './librairies/helpers.js';
import './librairies/lightswitch.js';
import Calendar from '@toast-ui/calendar';

const DAYNAMES_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

window.Quebec = {

	secrets: null,
	
	prec: null,
	suiv: null,
	title: null,
	calendar: null,


	unPays: async function () {

		this.title = document.querySelector('.calendrier__pagination__cour');
		document.querySelector('.calendrier__pagination__prec > span').addEventListener('click', e => this.previous());
		document.querySelector('.calendrier__pagination__suiv > span').addEventListener('click', e => this.next());
		
		
		this.calendar = new Calendar('.calendrier__container', {
			defaultView: 'month',
			isReadOnly: true,
			timezone: { zones: [{ timezoneName: 'America/Toronto' }] },
			usageStatistics: false,
			month: { dayNames: DAYNAMES_FR },
			week: { dayNames: DAYNAMES_FR },

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
		this.setTitle();


		await loadJsonProperties(this, { secrets: '/bt1oh97j7X.json' });

		console.log('Québec un pays!');
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