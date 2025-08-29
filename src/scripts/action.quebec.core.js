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
					backgroundColor: 'var(--bg-alpha)'
				},
			}

		});

		await loadJsonProperties(this, { secrets: '/bt1oh97j7X.json' });

		console.log('Québec un pays!');
	},




};