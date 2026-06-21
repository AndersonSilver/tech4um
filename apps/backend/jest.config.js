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
};
