export default {
  preset: "ts-jest",
  testMatch: ["**/__tests__/*.test.mts"],
  testEnvironment: "node",
  transform: {
    "^.+\\.mts$": "ts-jest",
  },
  moduleFileExtensions: ["js", "mts"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
