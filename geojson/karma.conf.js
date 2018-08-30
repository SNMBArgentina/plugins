module.exports = function(config) {
	var defaults = require('../tests/karma.defaults.js');
	defaults.files.push({
		pattern: 'node_modules/wellknown/wellknown.js',
		included: false
	});
	config.set(defaults);
};
