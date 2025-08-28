import './lightswitch.js';
import Calendar from '@toast-ui/calendar';
import { loadJsonProperties } from './helpers.js';


window.Quebec = {

	secrets: null,

	calendrier: null,



	UnPays: async function() {

		this.calendrier = new Calendar('#calendrier', {
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