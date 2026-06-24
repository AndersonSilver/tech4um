/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/services/**/*.test.ts",
    "**/controllers/**/*.test.ts",
  ],
  clearMocks: true,
  setupFiles: ["<rootDir>/../jest.setup.js"],
  globalTeardown: "<rootDir>/../jest.globalTeardown.js",
  collectCoverageFrom: [
    "**/*.ts",
    "!**/__tests__/**",
    "!**/*.test.ts",
    "!server.ts",
    "!config/**",
    "!scripts/**",
    "!routes/**",
  ],
  coverageDirectory: "<rootDir>/../coverage",
  coverageReporters: ["text-summary", "lcov"],
  coverageThreshold: {
    global: {
      lines: 70,
      statements: 70,
      branches: 50,
      functions: 55,
    },
  },
};
