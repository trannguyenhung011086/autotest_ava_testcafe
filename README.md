# E2E test for API & UI

**Approach:** dockerize all test files and environments to run test via docker container

_Precondition_

-   Install latest node version
-   Install `yarn`
-   Run `yarn install` to install all dependencies specified in package.json

## E2E API testing

Use GOT http request library and AVA framework to test APIs

_Structure_

-   common/utils: store GET/POST/PUT/DELETE class
-   tests/e2e_api: API test cases

Example test command: `NODE_ENV=stg ./node_modules/.bin/ava --verbose tests/e2e_api/`

_Note:_

-   after verifying failed snapshot tests, add `--update-snapshots` to test run command to update snapshots
-   to export ava report to xml, use `./node_modules/.bin/ava tests/e2e_api/non_checkout/sale_relate/bestSellers.info.spec.ts --tap | ./node_modules/.bin/tap-xunit | tee report/test.xml`

## E2E UI testing

Use Testcafe framework to test web application

_Structure_

-   tests/testcafe/page_objects: prepare page objects to use in test cases
-   tests/testcafe/e2e_ui/desktop: test cases for desktop theme
-   tests/testcafe/e2e_ui/mobile: test cases for mobile theme (emulated)

Example test command: `./node_modules/.bin/testcafe chromium tests/testcafe/desktop/ --fixture-meta type=regression --test-meta function=signin`

## Run with Gitlab CI

-   Refer to .gitlab-ci.yml to config run flow
-   _optional_ Set up local gitlab runner
    -   install Gitlab runner on local: https://docs.gitlab.com/runner/install/
    -   register Gitlab runner: https://docs.gitlab.com/runner/register/index.html
        -   use url: https://gitlab.leflair.io/
        -   use token: jAHUz_91yJUkRJm8m_gG
    -   start Gitlab runner on local

# Add living documentation for features

-   use `./node_modules/.bin/featurebook serve features/` to generate HTML for feature documentation

## TO-DO

Integrate test result with reportportal dashboard http://reportportal.io/
e.g. `$ ls foo.xml`
foo.xml
`$ zip foo.zip foo.xml`
adding: foo.xml (deflated 47%)
`$ curl -X POST --header 'Content-Type: multipart/form-data' --header 'Accept: application/json' --header 'Authorization: bearer aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' -F file=@foo.zip 'http://192.168.1.224:8080/api/v1/foo/launch/import'`
{"msg":"Launch with id = 5be4de6842eba40001b30534 is successfully imported."}

Need to configure UAT (authorization), API, JIRA, RALLY in docker-compose.yml for reportportal

-   rp.mongo.host=XXX
-   rp.mongo.port=27017
-   rp.mongo.dbName=reportportal
-   rp.mongo.user=XXX
-   rp.mongo.password=XXX
