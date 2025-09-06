window.LightSwitch = {

	switch: null,
	mutexVwpx: null,

	init: async function() {
		const theme = localStorage.getItem('theme');
		if(theme) document.documentElement.setAttribute('data-theme', theme);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => this.setTheme(e.matches ? 'dark' : 'light'));
		document.documentElement.style.setProperty('--vwpx', String(window.innerWidth));
		document.addEventListener('DOMContentLoaded', async () => {
			const button = document.body.create('div', 'lightswitch');
			button.addEventListener('click', () => this.toogleTheme());
			button.title = "Nuit / Jour";
		});
		window.addEventListener('resize', () => {
			if (this.mutexVwpx != null) return;
			this.mutexVwpx = requestAnimationFrame(() => {
				document.documentElement.style.setProperty('--vwpx', String(window.innerWidth));
				this.mutexVwpx = null;
			});
		});
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