*Precondition*
- Install latest node v10
- Run `npm install` to install all dependencies specified in package.json
- Import `jest-extended` to test case to extend Jest matcher
- *optional* Set up debug node js for jest with Visual Studio Code https://github.com/Microsoft/vscode-recipes/tree/master/debugging-jest-tests

## E2E API testing
Use axios http request libray and jest framework to test APIs

Structure:
- common/utils: store GET/POST/PUT/DELETE class
- e2e_api: API test cases

## E2E UI testing
Use selenium-webdriver (typescript) and jest framework to test web app

*Structure*
- common/browser: store common class and methods to interact with web elements
- page_objects: prepare page objects with common library to use in Selenium test cases
- tests/e2e_ui/desktop: Selenium test cases for desktop theme
- tests/e2e_ui/mobile: Selenium test cases for mobile theme (emulated)

*Notes*
- refer to scripts part at package.json to run test suites
e.g. use `npm run test_ui_chrome` to run all desktop test cases on local Chrome
- use node env when run npm to specify using local webdrivers or remote url
e.g. use `SELENIUM_REMOTE_URL=http://localhost:4444/wd/hub npm run test_ui_chrome` to run all desktop test cases on Selenium server for Chrome

## Work with Selenoid
- Selenoid is an alternative solution to Selenium Grid which is built on Go and produce faster speed and lighter resources consumption.
- Start with Docker
    - Pull image and generate config file: `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aerokube/cm:1.0.0 selenoid --last-versions 1 --tmpfs 128 --pull > $PWD/config/browsers.json`
    - Start server: `docker run -d --name selenoid -p 4444:4444 -v /var/run/docker.sock:/var/run/docker.sock -v $PWD/config/:/etc/selenoid/:ro aerokube/selenoid:latest-release`
- Point Selenium test run to `http://localhost:4444/wd/hub` as we run with normal Selenium server

## Reporter Junit
Use jest-junit reporter to export test result with Junit format to report folder
*Notes* to use with CI, run `jest --ci --reporters=default --reporters=jest-junit`

## Reporter Allure
Use Allure Reporter to generate HTML report with jest-allure (https://github.com/zaqqaz/jest-allure)
- Allure result XML will be generated after running test with jest
- run `allure serve` to see report on browser

## Run with Gitlab CI
- Refer to .gitlab-ci.yml to config run flow
    - start docker with Selenoid
    - run parallel test cases on: Chrome, Firefox, mobile, API (currently point to testing environment)
    - stop docker
- Tests will be triggered automatically for every commit to this repo.
- Due to Selenium tests are not stable with shared Gitlab runner, we should use local Gitlab runner to test as alternative.
    - install Gitlab runner on local: https://docs.gitlab.com/runner/install/
    - register Gitlab runner: https://docs.gitlab.com/runner/register/index.html
        - use url: https://gitlab.leflair.io/
        - use token: jAHUz_91yJUkRJm8m_gG
    - start Gitlab runner on local

## Run with BuddyWorks CI (buddy.works):
- Due to limited share gitlab runner for multiple projects, we can trigger pipelines with BuddyWorks CI via buddy.yml
- BuddyWorks is Docker-based environment so we can make use of prepared images on their platform.
- Tests will be triggered automatically for every commit to Gitlab repo thanks to webhook with BuddyWorks.

## TO-DO
Integrate test result with reportportal dashboard http://reportportal.io/
e.g. `$ ls foo.xml` 
foo.xml
`$ zip foo.zip foo.xml`
  adding: foo.xml (deflated 47%)
`$ curl -X POST --header 'Content-Type: multipart/form-data' --header 'Accept: application/json' --header 'Authorization: bearer aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' -F file=@foo.zip 'http://192.168.1.224:8080/api/v1/foo/launch/import'`
{"msg":"Launch with id = 5be4de6842eba40001b30534 is successfully imported."}

Need to configure UAT (authorization), API, JIRA, RALLY in docker-compose.yml for reportportal
- rp.mongo.host=XXX
 - rp.mongo.port=27017
 - rp.mongo.dbName=reportportal
 - rp.mongo.user=XXX
 - rp.mongo.password=XXX