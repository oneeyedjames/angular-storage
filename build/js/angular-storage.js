angular.module('angular.plugins.storage', [])

.provider('$storage', function() {
	var defaultTemplateTimeout = NaN;

	this.setDefaultTemplateTimeout = function(timeout) {
		defaultTemplateTimeout = parseInt(timeout);
	};

	this.$get = ['$window', function($window) {
		var $cache = $window.localStorage;

		var getString = function(key) {
			return hasString(key) ? $cache.getItem(key) : null;
		};

		var putString = function(key, value, timeout) {
			if (value !== null && value !== '') {
				timeout = parseInt(timeout);

				if (timeout > 0) {
					setTimeout(function() {
						removeString(key);
					}, timeout);

					$cache.setItem(key + '/expire', Date.now() + timeout);
				}

				$cache.setItem(key, value);
			}
		};

		var hasString = function(key) {
			if (key.match(/\/expire$/i))
				return false;

			var expire = parseInt($cache.getItem(key + '/expire'));

			if (Date.now() > expire) {
				removeString(key);
				return false;
			}

			return $cache.hasOwnProperty(key);
		};

		var removeString = function(key) {
			$cache.removeItem(key);
			$cache.removeItem(key + '/expire');
		};

		var getObject = function(key) {
			return angular.fromJson(getString(key));
		};

		var putObject = function(key, value, timeout) {
			putString(key, angular.toJson(value, false), timeout);
		};

		var documentKey = function(collection, id) {
			return ['document', collection, id].join('/');
		};

		var templateKey = function(collection, view) {
			return ['template', collection, view].join('/');
		};

		var uuid = function() {
			return Math.floor(Math.random() * Math.pow(16, 8)).toString(16) + '-'
				+ Math.floor(Math.random() * Math.pow(16, 4)).toString(16) + '-'
				+ Math.floor(Math.random() * Math.pow(16, 4)).toString(16) + '-'
				+ Math.floor(Math.random() * Math.pow(16, 4)).toString(16) + '-'
				+ Math.floor(Math.random() * Math.pow(16, 12)).toString(16);
		};

		return {
			clear: function() {
				$cache.clear();
			},

			searchDocuments: function(collection, filter) {
				filter = filter || function(doc, docId) { return true; };

				var docs = [];

				for (var i = 0, n = $cache.length; i < n; i++) {
					var key = $cache.key(i);

					if (hasString(key)) {
						var path = key.split('/');

						if (path[0] == 'document' && path[1] == collection) {
							var doc = getObject(key);

							if (filter(doc, path[2]))
								docs.push(doc);
						}
					}
				}

				return docs;
			},

			getDocument: function(collection, documentId) {
				return getObject(documentKey(collection, documentId));
			},

			putDocument: function(collection, docId, doc, timeout) {
				docId = docId || uuid();

				putObject(documentKey(collection, docId), doc, timeout);

				return docId;
			},

			hasDocument: function(collection, documentId) {
				return hasString(documentKey(collection, documentId));
			},

			removeDocument: function(collection, documentId) {
				removeString(documentKey(collection, documentId));
			},

			getTemplate: function(collection, view) {
				return getString(templateKey(collection, view));
			},

			putTemplate: function(collection, view, tmpl, timeout) {
				if (isNaN(parseInt(timeout)))
					timeout = defaultTemplateTimeout;

				putString(templateKey(collection, view), tmpl, timeout);
			},

			hasTemplate: function(collection, view) {
				return hasString(templateKey(collection, view));
			},

			removeTemplate: function(collection, view) {
				removeString(templateKey(collection, view));
			}
		};
	}];
});
