module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/?(*.)+(spec|test).ts"], // Look for *.test.ts or *.spec.ts files
    moduleFileExtensions: ["ts", "js"],
    roots: ["<rootDir>"], // Search in project root
};