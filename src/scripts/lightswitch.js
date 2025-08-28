window.LightSwitch = {

	init: function() {

		const theme = localStorage.getItem('theme');
		if(theme) document.documentElement.setAttribute('data-theme', theme);

	},

	setTheme: function(theme) {

	}

};

LightSwitch.init();