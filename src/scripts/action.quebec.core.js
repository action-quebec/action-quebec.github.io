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
					saturday: { color: '#111827' },
					holiday:  { color: '#111827' },
					dayName:  { color: '#111827' },
					backgroundColor: 'var(--bg-alpha)'
				},
				month: {
					holidayExceptThisMonth: { color: '#1118278c' }, // dimanches hors mois
					dayExceptThisMonth:     { color: '#1118278c' }  // tous jours hors mois
				}
			}

		});

		await loadJsonProperties(this, { secrets: '/bt1oh97j7X.json' });

		console.log('Québec un pays!');
	},




};