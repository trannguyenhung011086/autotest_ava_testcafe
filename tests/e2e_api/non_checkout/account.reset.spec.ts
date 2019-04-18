import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as faker from "faker/locale/vi";

const request = new Utils.AccountUtils();

import test from "ava";

test("Get 400 error code when using empty password", async t => {
    const res = await request.post(config.api.reset, {
        password: "",
        token: "TEST_TOKEN"
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "RESET_INVALID_PASSWORD");
});

test("Get 400 error code when using password with length < 7", async t => {
    const res = await request.post(config.api.reset, {
        password: "123456",
        token: "TEST_TOKEN"
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "RESET_INVALID_PASSWORD");
});

test("Get 400 error code when using invalid token", async t => {
    const res = await request.post(config.api.reset, {
        password: "123456789",
        token: faker.random.uuid
    });

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "COULD_NOT_CHANGE_PASSWORD_TOKEN_EXPIRED");
});
