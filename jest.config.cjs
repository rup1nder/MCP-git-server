module.exports = {
  preset: null,
  testEnvironment: 'node',
  injectGlobals: true,
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(simple-git|@modelcontextprotocol)/)'
  ],
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  testPathIgnorePatterns: [
    'tests/git-server.test.js',
    'tests/test-current-repo.test.js',
    'tests/test-repo-path-fix.test.js'
  ],
  collectCoverageFrom: [
    'git-server.js',
    '!node_modules/**',
    '!tests/**',
    '!src/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
