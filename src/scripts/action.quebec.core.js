import './librairies/helpers.js';
import './librairies/lightswitch.js';
import Calendar from '@toast-ui/calendar';


window.Quebec = {

	secrets: null,
	calendar: null,



	unPays: async function () {
		
		const DAYNAMES_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
		this.calendar = new Calendar('.calendrier__container', {
			defaultView: 'month',
			isReadOnly: true,
			timezone: { zones: [{ timezoneName: 'America/Toronto' }] },
			usageStatistics: false,
			month: { dayNames: DAYNAMES_FR },  // vue mois
			week: { dayNames: DAYNAMES_FR },  // vues semaine/jour

			theme: {
				common: {
					saturday: { color: 'var(--cal-text)' },
					holiday:  { color: 'var(--cal-text)' },
					dayName:  { color: 'var(--cal-text)' },
					backgroundColor: 'var(--bg-alpha)'
				},
				month: {
					holidayExceptThisMonth: { color: 'var(--cal-text-alpha)' }, // dimanches hors mois
					dayExceptThisMonth:     { color: 'var(--cal-text-alpha)' }  // tous jours hors mois
				}
			}

		});

		await loadJsonProperties(this, { secrets: '/bt1oh97j7X.json' });

		console.log('Québec un pays!');
	},




};