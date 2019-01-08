const { UNIT_TEST_ENV } = process.env;

let externalLogger = {};

if (UNIT_TEST_ENV) {
  externalLogger = {
    debug: () => {},
    warn: () => {},
    info: () => {},
    error: () => {}
  };
}

module.exports = externalLogger;
module.exports.setLogger = logger => externalLogger = logger;
