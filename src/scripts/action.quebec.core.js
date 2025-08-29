import './helpers.js';
import './lightswitch.js';
import Calendar from '@toast-ui/calendar';



window.Quebec = {

	secrets: null,
	calendar: null,



	UnPays: async function() {

		this.calendar = new Calendar('#calendrier', {
			defaultView: 'month',
			isReadOnly: true,
			timezone: { zones: [{ timezoneName: 'America/Toronto' }] },
			usageStatistics: false
		});

		await loadJsonProperties(this, {
            secrets:  '/bt1oh97j7X.json',
        });









		console.log('Québec un pays!');
	},




};