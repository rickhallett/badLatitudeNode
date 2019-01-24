const async_log = require('debug')('async: http');
async_log.enabled = true;
const log = require('debug')('sync: sync');
log.enabled = true;

module.exports = {
    async_log,
    log
};
