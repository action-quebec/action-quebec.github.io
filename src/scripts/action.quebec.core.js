import './helpers.js';
import './lightswitch.js';
import Calendar from '@toast-ui/calendar';
// import frLocale from '@toast-ui/calendar/locales/fr';



window.Quebec = {

	secrets: null,
	calendar: null,



	UnPays: async function () {
		
		const DAYNAMES_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
		this.calendar = new Calendar('#calendrier', {
			defaultView: 'month',
			isReadOnly: true,
			timezone: { zones: [{ timezoneName: 'America/Toronto' }] },
			usageStatistics: false,
			month: { dayNames: DAYNAMES_FR },  // vue mois
			week: { dayNames: DAYNAMES_FR },  // vues semaine/jour

		});

		await loadJsonProperties(this, { secrets: '/bt1oh97j7X.json' });









		console.log('Québec un pays!');
	},




};