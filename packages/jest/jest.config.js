export default {
  preset: "ts-jest/presets/default-esm",
  testMatch: ["**/__tests__/*.test.mts"],
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".mts"],
  transform: {
    "^.+\\.mts$": [
      "ts-jest",
      {
        useESM: true,
        isolatedModules: true,
      },
    ],
  },
  moduleFileExtensions: ["js", "mts"],
  transformIgnorePatterns: ["node_modules/(?!@given3/)"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.mjs$": "$1.mts",
  },
};
