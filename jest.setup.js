require('jest-extended');

var allure = require("jest-allure/dist/setup")

allure.registerAllureReporter()

jest.setTimeout(60000)