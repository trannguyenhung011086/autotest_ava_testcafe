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

test("GET / cannot see order of another customer", async t => {
    const res = await request.get(
        config.api.orders + "/5be3ea348f2a5c000155efbc",
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.length, 0);
    t.snapshot(res.body);
});

test("GET / can access orders", async t => {
    const res = await request.get(config.api.orders, t.context["cookie"]);

    const orders: Model.OrderSummary[] = res.body;

    orders.forEach(order => {
        request.validateOrderSummary(t, order);
    });
});

test("GET / can see order info using order ID", async t => {
    let orders = await request.getOrders(t.context["cookie"]);

    orders = orders.reduce((result, value) => {
        const exclude = [
            "5c5185f6a332d20001a3464e",
            "5c517d0447ad080001cb2171",
            "5c516a186c839f000197a25a"
        ]; // exclude error order. see WWW-639
        if (!exclude.includes(value.id)) {
            result.push(value);
        }
        return result;
    }, []);

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

test("GET / can see order info using order code", async t => {
    const orders = await request.getOrders(t.context["cookie"]);
    let rand = Math.floor(Math.random() * orders.length);

    // exclude error order. see WWW-639
    if (
        [
            "5c5185f6a332d20001a3464e",
            "5c517d0447ad080001cb2171",
            "5c516a186c839f000197a25a"
        ].includes(orders[rand].id)
    ) {
        rand = 0;
    }

    t.log("Test order " + orders[rand].code + " " + orders[rand].id);

    const res = await request.get(
        config.api.orders + "/" + orders[rand].code,
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
});

test("GET / cannot access order info with invalid cookie", async t => {
    const res = await request.get(
        config.api.orders + "/5be3ea348f2a5c000155efbc",
        "leflair.connect2.sid=test"
    );

    t.deepEqual(res.statusCode, 401);
    t.deepEqual(res.body.message, "Invalid request.");
    t.snapshot(res.body);
});
