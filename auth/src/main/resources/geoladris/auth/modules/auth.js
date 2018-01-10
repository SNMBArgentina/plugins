define([ 'message-bus', 'i18n', './auth-user', 'module', 'ui/ui', 'toolbar' ], function(bus, i18n, authUser, module, ui) {
	var LOGOUT = 'logout';
	var LOGIN = 'login';
	var DIALOG_ID = 'auth-dialog';

	var config = module.config();
	var buttonConf = config.button;

	var form;
	var userInput;
	var passInput;

	function loginSuccess(data, textStatus, jqXHR) {
		console.log(data);
		console.log(textStatus);
		console.log(jqXHR);
		// Disable inputs so their values are not appended to the URL
		userInput.setAttribute('disabled', 'disabled');
		passInput.setAttribute('disabled', 'disabled');

		// Set redirection to the form and submit
		var url = window.location.href;
		url = url.substring(0, url.lastIndexOf('/') + 1);
		form.setAttribute('action', url);
		form.submit();
	}

	function doLogin(user, password) {
		if (!user || !password) {
			bus.send('error', i18n['auth.login_error']);
		}

		bus.send('ui-loading:start', i18n['auth.wait']);
		bus.send('ajax', {
			type: 'POST',
			url: LOGIN,
			data: {
				user: user,
				password: password
			},
			success: loginSuccess,
			errorMsg: i18n['auth.login_error'],
			complete: function() {
				bus.send('ui-loading:end', i18n['auth.wait']);
			}
		});
	}

	function initLogged() {
		ui.create('button', {
			id: buttonConf.div,
			parent: buttonConf.parentDiv,
			css: 'auth-login-logout-button toolbar_button blue_button',
			html: i18n['auth.logout'] || 'Logout',
			clickEventName: 'ajax',
			clickEventMessage: {
				type: 'GET',
				url: LOGOUT,
				success: function() {
				},
				errorMsg: i18n['auth.login_error'],
				complete: function() {
					window.location.reload();
				}
			}
		});

		bus.send('login', authUser);
	}

	function initNotLogged() {
		ui.create('button', {
			id: buttonConf.div,
			parent: buttonConf.parentDiv,
			css: 'auth-login-logout-button toolbar_button blue_button',
			html: i18n['auth.login'] || 'Login',
			clickEventName: 'ui-show',
			clickEventMessage: DIALOG_ID
		});

		ui.create('dialog', {
			id: DIALOG_ID,
			parent: document.body,
			css: 'auth-dialog',
			title: i18n['auth.title'],
			closeButton: true
		});

		form = ui.create('form', {
			id: DIALOG_ID + '-form',
			parent: DIALOG_ID
		});

		userInput = ui.create('input', {
			id: DIALOG_ID + '-user',
			parent: DIALOG_ID + '-form',
			css: 'auth-input',
			label: i18n['auth.user']
		});

		passInput = ui.create('input', {
			id: DIALOG_ID + '-pass',
			parent: DIALOG_ID + '-form',
			css: 'auth-input',
			label: i18n['auth.pass'],
			type: 'password'
		});

		var send = ui.create('div', {
			id: DIALOG_ID + '-submit-button',
			parent: DIALOG_ID + '-form',
			css: 'auth-submit blue_button',
			html: i18n['auth.submit']
		});

		send.addEventListener("click", function() {
			doLogin(userInput.value, passInput.value);
		});
	}

	if (typeof authUser === 'string') {
		initLogged();
	} else {
		initNotLogged();
	}
});
