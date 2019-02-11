const utils = require('../../utils'),
      querystring = require('querystring'),
      constants = require('../../constants');

const waitForSentinel = docIds => {
  return requestOnSentinelTestDb('/_local/sentinel-meta-data')
    .then(metaData => metaData.processed_seq)
    .then(seq => {
      const changeOpts = {
        since: seq,
        filter: '_doc_ids',
        doc_ids: JSON.stringify(Array.isArray(docIds) ? docIds : [docIds])
      };
      return utils.requestOnTestDb('/_changes?' + querystring.stringify(changeOpts));
    })
    .then(response => {
      if (response.results && !response.results.length) {
        // sentinel has caught up and processed our doc
        return;
      }

      return new Promise(resolve => {
        setTimeout(() => waitForSentinel(docIds).then(resolve), 100);
      });
    });
};

const requestOnSentinelTestDb = (options) => {
  if (typeof options === 'string') {
    options = {
      path: options,
    };
  }
  options.path = '/' + constants.DB_NAME + '-sentinel' + (options.path || '');
  return utils.request(options);
};

const getInfoDoc = docId => {
  return requestOnSentinelTestDb('/' + docId + '-info');
};

const getInfoDocs = (docIds = []) => {
  const opts = {
    keys: JSON.stringify(docIds.map(id => id + '-info')),
    include_docs: true
  };
  return requestOnSentinelTestDb('/_all_docs?' + querystring.stringify(opts))
    .then(response => response.rows.map(row => row.doc));
};

module.exports = {
  waitForSentinel: waitForSentinel,
  requestOnSentinelTestDb: requestOnSentinelTestDb,
  getInfoDoc: getInfoDoc,
  getInfoDocs: getInfoDocs
};
