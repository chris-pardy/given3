const { join } = require('path');
const { name } = require('./package.json');

module.exports = {
  collectCoverageFrom: ['**/*.{t,j}s?(x)'],
  coveragePathIgnorePatterns: ['__(.+?)__'],
  verbose: true,
  rootDir: join(__dirname, './src'),
  transform: {
    '^.+\\.ts$': 'babel-jest'
  },
  moduleFileExtensions: ['json', 'ts', 'js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    [`^${name}$`]: join(__dirname, './src/index.ts')
  }
};
