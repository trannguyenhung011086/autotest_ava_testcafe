import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as Model from "../../../../common/interface";

const request = new Utils.OrderUtils();

import test from "ava";

test.before(async t => {
    t.context["cookie"] = await request.getLogInCookie(
        config.testAccount.email_in,
        config.testAccount.password_in
    );
});

test("Get empty result when accessing order of another customer", async t => {
    const res = await request.get(
        config.api.orders + "/5be3ea348f2a5c000155efbc",
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.length, 0);
    t.snapshot(res.body);
});

test("Get 200 success code when accessing orders with valid cookie", async t => {
    const res = await request.get(config.api.orders, t.context["cookie"]);

    const orders: Model.OrderSummary[] = res.body;

    orders.forEach(order => {
        request.validateOrderSummary(t, order);
    });
});

test("Get 200 success code when accessing order info using order ID", async t => {
    let orders = await request.getOrders(t.context["cookie"]);

    for (let order of orders) {
        const res = await request.get(
            config.api.orders + "/" + order.id,
            t.context["cookie"]
        );
        t.deepEqual(res.statusCode, 200);

        const orderItem: Model.Order = res.body;

        request.validateOrderDetail(t, orderItem);
    }
});

test("Get 200 success code when accessing order info using order code", async t => {
    let orders = await request.getOrders(t.context["cookie"]);

    for (let order of orders) {
        const res = await request.get(
            config.api.orders + "/" + order.code,
            t.context["cookie"]
        );
        t.deepEqual(res.statusCode, 200);

        if (Array.isArray(res.body)) {
            for (const item of res.body) {
                request.validateOrderDetail(t, item);
            }
        } else {
            request.validateOrderDetail(t, res.body);
        }
    }
});

test("Get 401 error code when accessing order info with invalid cookie", async t => {
    const res = await request.get(
        config.api.orders + "/5be3ea348f2a5c000155efbc",
        "leflair.connect2.sid=test"
    );

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "Invalid request.");
    t.snapshot(res.body);
});
