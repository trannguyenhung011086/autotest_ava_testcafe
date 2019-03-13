import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const request = new Utils.OrderUtils();

import test from "ava";

test.before(async t => {
    t.context["cookie"] = await request.getLogInCookie(
        config.testAccount.email_in,
        config.testAccount.password_in
    );
});

test("GET / cannot see order of another customer", async t => {
    const res = await request.get(
        config.api.orders + "/5be3ea348f2a5c000155efbc",
        t.context["cookie"]
    );
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.length, 0);
});

test("GET / can access orders", async t => {
    const res = await request.get(config.api.orders, t.context["cookie"]);

    const orders: Model.OrderSummary[] = res.body;

    orders.forEach(order => {
        request.validateOrderSummary(t, order);
    });
});

test("GET / can see order info using order ID", async t => {
    const orders = await request.getOrders(t.context["cookie"]);
    const rand = Math.floor(Math.random() * orders.length);

    const res = await request.get(
        config.api.orders + "/" + orders[rand].id,
        t.context["cookie"]
    );

    const orderItem: Model.Order = res.body;

    request.validateOrderDetail(t, orderItem);
});

test("GET / can see order info using order code", async t => {
    const orders = await request.getOrders(t.context["cookie"]);
    const rand = Math.floor(Math.random() * orders.length);

    const res = await request.get(
        config.api.orders + "/" + orders[rand].code,
        t.context["cookie"]
    );

    if (Array.isArray(res.body)) {
        for (const item of res.body) {
            request.validateOrderDetail(t, item);
        }
    } else {
        request.validateOrderDetail(t, res.body);
    }
});

test("GET / cannot access order info with invalid cookie", async t => {
    const res = await request.get(
        config.api.orders + "/5be3ea348f2a5c000155efbc",
        "leflair.connect2.sid=test"
    );
    t.snapshot(res.body);

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "Invalid request.");
});
