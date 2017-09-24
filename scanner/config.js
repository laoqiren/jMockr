const path = require('path');
const fileUtil = require('../util/fileUtil');
const config = fileUtil.json5Require(path.resolve('./jmockr.config.json'));

config.templateRoot = config.templateRoot || '.';

module.exports = config;
