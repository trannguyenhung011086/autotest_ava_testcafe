import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as faker from "faker/locale/vi";
import * as Model from "../../../common/interface";

const request = new Utils.AccountUtils();

import test from "ava";

test.beforeEach(async t => {
    t.context["cookie"] = await request.pickRandomUser(
        config.testAccount.email_ex
    );
});

test("Get 200 success code when accessing account info with valid cookie", async t => {
    const res = await request.get(config.api.account, t.context["cookie"]);

    const account: Model.Account = res.body;

    t.deepEqual(res.statusCode, 200);
    t.truthy(account.id);
    t.true(request.validateEmail(account.email));
    t.true(account.hasOwnProperty("firstName"));
    t.true(account.hasOwnProperty("lastName"));
    t.regex(account.language, /en|vn/);
    t.deepEqual(typeof account.accountCredit, "number");
    t.deepEqual(account.provider, "local");
    t.deepEqual(account.state, "confirmed");
    t.truthy(account.gender);
    t.truthy(account.cart);

    if (account.stripe && Object.keys(account.stripe).length > 0) {
        t.truthy(account.stripe.customerId);
    }
    if (account.nsId) {
        t.truthy(account.nsId);
    }

    t.deepEqual(typeof account.setting.subscribed, "boolean");
});

test("Get 200 success code when changing name with valid cookie", async t => {
    const firstName = "QA_" + faker.name.firstName();
    const lastName = "QA_" + faker.name.lastName();

    const res = await request.put(
        config.api.account,
        {
            firstName: firstName,
            lastName: lastName
        },
        t.context["cookie"]
    );

    const signIn: Model.SignIn = res.body;

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(signIn.firstName, firstName);
    t.deepEqual(signIn.lastName, lastName);
});

test.skip("Get 400 error code when changing email", async t => {
    const res = await request.put(
        config.api.account,
        {
            email: "new-" + config.testAccount.email_ex[2]
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "USER_UPDATE_ERROR");
}); // wait for WWW-335

test("Get 401 error code when updating account info with invalid cookie", async t => {
    const res = await request.put(
        config.api.account,
        {
            firstName: "first",
            lastName: "last"
        },
        "leflair.connect2.sid=test"
    );

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "Access denied.");
});

test("Get 400 error code when using wrong current password to update password", async t => {
    const res = await request.put(
        config.api.password,
        {
            currentPassword: faker.internet.password(),
            newPassword: faker.internet.password()
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "COULD_NOT_CHANGE_PASSWORD");
});

test("Get 400 error code when using empty current password to update password", async t => {
    const res = await request.put(
        config.api.password,
        {
            currentPassword: "",
            newPassword: faker.internet.password()
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "COULD_NOT_CHANGE_PASSWORD");
});

test("Get 400 error code when using current password with length < 7 to update password", async t => {
    const res = await request.put(
        config.api.password,
        {
            currentPassword: "leflairqa",
            newPassword: "123456"
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "COULD_NOT_CHANGE_PASSWORD");
});

test("Get 400 error code when using empty new password to update password", async t => {
    const res = await request.put(
        config.api.password,
        {
            currentPassword: "leflairqa",
            newPassword: ""
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "COULD_NOT_CHANGE_PASSWORD");
});

test("Get 200 success code when updating valid password", async t => {
    const res = await request.put(
        config.api.password,
        {
            currentPassword: config.testAccount.password_ex,
            newPassword: config.testAccount.password_ex
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.message, "PASSWORD_CHANGED");
});

test("Get 401 error code when updating password with invalid cookie", async t => {
    const res = await request.put(
        config.api.password,
        {
            currentPassword: "leflairqa",
            newPassword: "leflairqa"
        },
        "leflair.connect2.sid=test"
    );

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "Access denied.");
});

test("Get 400 error code when using invalid subscription status", async t => {
    const res = await request.put(
        config.api.newsletter,
        {
            subscriptionStatus: ""
        },
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "INVALID_SUBSCRIPTION_STATUS");
});

test("Get 401 error code when updating subscription status with invalid cookie", async t => {
    const res = await request.put(
        config.api.newsletter,
        {
            subscriptionStatus: true
        },
        "leflair.connect2.sid=test"
    );

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "Access denied.");
});

test.serial(
    "Get 200 success code when updating subscription status to true",
    async t => {
        let res = await request.put(
            config.api.newsletter,
            {
                subscriptionStatus: true
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 200);
        t.deepEqual(res.body.message, "STATUS_CHANGED");

        res = await request.get(config.api.account, t.context["cookie"]);
        const account: Model.Account = res.body;

        t.true(account.setting.subscribed);
    }
);

test.serial(
    "Get 200 success code when updating subscription status to false",
    async t => {
        let res = await request.put(
            config.api.newsletter,
            {
                subscriptionStatus: false
            },
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 200);
        t.deepEqual(res.body.message, "STATUS_CHANGED");

        res = await request.get(config.api.account, t.context["cookie"]);
        const account: Model.Account = res.body;

        t.false(account.setting.subscribed);
    }
);
