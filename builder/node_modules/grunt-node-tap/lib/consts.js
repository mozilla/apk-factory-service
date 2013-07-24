"use strict";

module.exports = function () {
	return {
		outputTypes: function () {
			return ['stats', 'failures', 'tap'];
		},
		outputDestinations: function () {
			return ['console', 'file'];
		},
		exitCodes: function () {
			return {
				fatal: 1,
				taskFailed: 3
			};
		}
	};
};
