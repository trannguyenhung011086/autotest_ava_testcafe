*Precondition*
- Install latest node version
- Run `npm install` to install all dependencies specified in package.json (if have permission issue: use flag `--unsafe-perm=true`)
- *optional* Set up debug node js for jest with Visual Studio Code https://github.com/Microsoft/vscode-recipes/tree/master/debugging-jest-tests

## E2E API testing
Use axios http request libray and Jest framework to test APIs

Structure:
- common/utils: store GET/POST/PUT/DELETE class
- tests/jest/e2e_api: API test cases

Example test command: jest tests/jest/e2e_api/account

## E2E UI testing
Use Testcafe framework to test web application

*Structure*
- tests/testcafe/page_objects: prepare page objects to use in test cases
- tests/testcafe/e2e_ui/desktop: test cases for desktop theme
- tests/testcafe/e2e_ui/mobile: test cases for mobile theme (emulated)

Example test command: testcafe chromium tests/testcafe/desktop/

## Run with Gitlab CI
- Refer to .gitlab-ci.yml to config run flow
- *optional* Set up local gitlab runner
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