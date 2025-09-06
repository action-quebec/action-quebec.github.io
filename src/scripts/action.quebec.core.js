import './librairies/helpers';
import './librairies/lightswitch';

import Croper from './includes/croper'
import Calendar from './includes/calendar'


window.Quebec = {

	unPays: async () => new Calendar,

	independant: async () => new Croper,

};