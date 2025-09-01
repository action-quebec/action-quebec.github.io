window.LightSwitch = {

	switch: null,

	init: function() {
		const theme = localStorage.getItem('theme');
		if(theme) document.documentElement.setAttribute('data-theme', theme);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => this.setTheme(e.matches ? 'dark' : 'light'));
  		document.addEventListener('DOMContentLoaded', e => document.body.create('div', 'lightswitch').addEventListener('click', e => this.toogleTheme()));
		window.addEventListener('resize', async e => document.documentElement.style.setProperty('--vwpx', String(window.innerWidth)), { passive: true });
		document.documentElement.style.setProperty('--vwpx', String(window.innerWidth));
	},


	getTheme: function() {
		return getComputedStyle(document.documentElement)
			.getPropertyValue('--theme')
			.replace(/^['"]|['"]$/g, '')
			.toLocaleLowerCase()
			.trim();
	},


	setTheme: function(theme) {
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	},


	toogleTheme: function() {
		this.setTheme(this.getTheme() === 'dark' ? 'light' : 'dark');
	},

};


LightSwitch.init();