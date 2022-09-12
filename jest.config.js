/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["lcov"],
  preset: "ts-jest",
  testEnvironment: "node",
};
