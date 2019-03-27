import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as faker from "faker/locale/vi";

const helper = new Utils.Helper();

import test from "ava";

test("Get 200 success code when using empty email", async t => {
    const res = await helper.post(config.api.subscribe, {
        email: ""
    });

    if (process.env.NODE_ENV == "prod") {
        t.deepEqual(res.statusCode, 200);
        t.deepEqual(res.body.message, "done");
    } else {
        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "fail");
    }
});

test("Get 200 success code when using wrong format email", async t => {
    const res = await helper.post(config.api.subscribe, {
        email: ".test%!@#$%^&*()_+<>?@mail.com"
    });

    if (process.env.NODE_ENV == "prod") {
        t.deepEqual(res.statusCode, 200);
        t.deepEqual(res.body.message, "done");
    } else {
        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "fail");
    }
});

test("Get 200 success code when using valid email format", async t => {
    const res = await helper.post(config.api.subscribe, {
        email: faker.internet.email()
    });

    if (process.env.NODE_ENV == "prod") {
        t.deepEqual(res.statusCode, 200);
        t.deepEqual(res.body.message, "done");
    } else {
        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "fail");
    }
});
