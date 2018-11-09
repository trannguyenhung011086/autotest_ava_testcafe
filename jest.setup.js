var allure = require("jest-allure/dist/setup")

allure.registerAllureReporter()

jest.setTimeout(45000)