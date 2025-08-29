window.LightSwitch = {

	switch: null,

	init: function() {

		const theme = localStorage.getItem('theme');
		if(theme) document.documentElement.setAttribute('data-theme', theme);

        document.addEventListener('DOMContentLoaded', e => {
            this.switch = document.body.create('div', 'lightswitch');
			this.switch.addEventListener('click', e => this.toogleTheme());
        });

		document.documentElement.style.setProperty('--vwpx', String(window.innerWidth));
  		addEventListener('resize', e => document.documentElement.style.setProperty('--vwpx', String(window.innerWidth)), { passive: true });

	},


	getTheme: function() {
		return getComputedStyle(document.documentElement)
			.getPropertyValue('--theme')
			.replace(/^['"]|['"]$/g, '')
			.toLocaleLowerCase()
			.trim();
	},


	toogleTheme: function() {
		const theme = this.getTheme() === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	},

};

LightSwitch.init();