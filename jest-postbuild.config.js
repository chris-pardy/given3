const { join } = require('path');
const { name, main } = require('./package.json');

module.exports = {
  ...require('./jest.config'),
  moduleNameMapper: {
    [`^${name}$`]: join(__dirname, main)
  }
}