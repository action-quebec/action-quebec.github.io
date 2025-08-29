window.LightSwitch = {

	switch: null,

	init: function() {

		const theme = localStorage.getItem('theme');
		if(theme) document.documentElement.setAttribute('data-theme', theme);

        document.addEventListener('DOMContentLoaded', e => {
            this.switch = document.body.create('div', 'lightswitch');
			this.switch.addEventListener('click', e => this.toogleTheme());
        });

	},


	toogleTheme: function() {
		document.documentElement.setAttribute('data-theme', this.getTheme() === 'dark' ? 'light' : 'dark');
	},


	getTheme: function() {
		return getComputedStyle(document.documentElement)
			.getPropertyValue('--theme')
			.replace(/^['"]|['"]$/g, '')
			.toLocaleLowerCase()
			.trim();
	},

};

LightSwitch.init();