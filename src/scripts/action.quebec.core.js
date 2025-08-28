import './lightswitch.js';
import Calendar from '@toast-ui/calendar';
import { loadJsonProperties } from './helper.utils';


// document.documentElement.setAttribute('data-theme', 'nuit')



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