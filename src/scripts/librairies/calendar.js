export default class Calendar {
	
	START_DOW = 0; // 0 = dimanche, 1 = lundi
	MONTH_NAMES = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
	WEEKDAY_NAMES = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
	
	container = null;
	month = null;

	


	constructor(selector) {
		const parent = document.querySelector(selector);
		this.container = parent.create('div', 'pxcalendar');
		const daynames = this.container.create('div', 'pxcalendar__daynames');

		// daynames.create('div', 'pxcalendar__daynames__name', 'Dim');
		this.WEEKDAY_NAMES.forEach(v => daynames.create('div', 'pxcalendar__daynames__name', v));
		this.month = this.container.create('div', 'pxcalendar__month');


		for(let i = 0; i < 42; i++) {
			this.month.create('div', 'pxcalendar__month__day', String(i));
		}
		
	}





	sayHello() {
		console.log(`Salut, je m'appelle ${this.name}`);
	}
}