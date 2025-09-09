import './librairies/helpers';
import './librairies/lightswitch';

import Help from './includes/help';
import Croper from './includes/croper'
import Calendar from './includes/calendar'

window.Quebec = {
	libre: async() => new Help,
	unPays: async () => new Calendar,
	independant: async () => new Croper,
};