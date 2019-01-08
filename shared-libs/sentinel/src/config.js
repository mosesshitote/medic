let config = {},
    translations = {};

module.exports = {
  setConfig: c => config = c,
  setTranslations: t => translations = t,

  get: key => config[key],
  getAll: () => config,
  getTranslations: () => translations
};
