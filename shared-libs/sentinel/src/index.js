const config = require('./config'),
      db = require('./db'),
      transitions = require('transitions');

module.export = {
  init: (sourceDb, settings, translations) => {
    db.setDb(sourceDb);
    config.setConfig(settings);
    config.setTranslations(translations);
  },

  transitions: transitions
};
