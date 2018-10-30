## E2E API testing
Use axios http request libray and jest framework to test APIs

Structure:
- common/utils: store GET/POST/PUT/DELETE class
- e2e_api: API test cases

## E2E UI testing
Use selenium-webdriver (typescript) and jest framework to test web app

Structure:
- common/browser: store common class and methods to interact with web elements
- page_objects: prepare page objects with common library to use in Selenium test cases
- tests/e2e_ui/desktop: Selenium test cases for desktop theme
- tests/e2e_ui/mobile: Selenium test cases for mobile theme (emulated)

*Notes:*
- refer to scripts part at package.json to run test suites
e.g. use "npm run test_ui_chrome" to run all desktop test cases on local Chrome
- use node env when run npm to specify using local webdrivers or remote url
e.g. use "SELENIUM_REMOTE_URL=http://localhost:4444/wd/hub npm run test_ui_chrome" to run all desktop test cases on Selenium server for Chrome

## Work with Selenoid
- Selenoid is an alternative solution to Selenium Grid which is built on Go and produce faster speed and lighter resources consumption.
- Start with Docker
    - Pull image and generate config file: docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aerokube/cm:1.0.0 selenoid --last-versions 1 --tmpfs 128 --pull > `pwd`/config/browsers.json
    - Start server: docker run -d --name selenoid -p 4444:4444 -v /var/run/docker.sock:/var/run/docker.sock -v `pwd`/config/:/etc/selenoid/:ro aerokube/selenoid:latest-release
- Point Selenium test run to http://localhost:4444/wd/hub as we run with normal Selenium server

## Reporter
Use jest-junit reporter to export test result with Junit format to report folder

*Note:* to use with CI, run `jest --ci --reporters=default --reporters=jest-junit`

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

## Run with BuddyWorks CI:
- Due to limited share gitlab runner for multiple projects, we can trigger pipelines with BuddyWorks CI via buddy.yml
- BuddyWorks is Docker-based environment so we can make use of prepared images on their platform.
- Tests will be triggered automatically for every commit to Gitlab repo thanks to webhook with BuddyWorks.

## TO-DO
Integrate test result with reportportal dashboard http://reportportal.io/