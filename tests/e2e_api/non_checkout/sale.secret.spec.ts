import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";

const request = new Utils.SaleUtils();
const access = new Utils.DbAccessUtils();

import test from "ava";

test.before(async t => {
    t.context["cookie"] = await request.getGuestCookie();
});

test("Get empty result when not call campaign API", async t => {
    const res = await request.get(config.api.secretSales, t.context["cookie"]);

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(res.body.length, 0);
});

test("Check false result when not call campaign API", async t => {
    const res = await request.get(
        config.api.secretSales + "/check",
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 200);
    t.false(res.body);
});

test("Get secret sale when call campaign API", async t => {
    const campaign: Model.Campaign = await access.getCampaign({
        endDate: { $gt: new Date() }
    });

    if (campaign) {
        await request.get(
            config.api.campaigns + campaign.name,
            t.context["cookie"]
        );

        const res = await request.get(
            config.api.secretSales,
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 200);

        const sales: Model.SalesModel[] = res.body;

        for (const sale of sales) {
            t.truthy(sale.title);
            t.truthy(sale.endTime);
            t.deepEqual(typeof sale.potd, "boolean");
            t.true(sale.slug.includes(sale.id));
            t.truthy(sale.categories);

            const saleInfo = await request.getSaleInfo(sale.id);

            t.true(saleInfo.campaign);
        }
    } else {
        t.log("No campaign available. Skip test!");
        t.pass();
    }
});

test("Check secret sale when call campaign API", async t => {
    const campaign: Model.Campaign = await access.getCampaign({
        endDate: { $gt: new Date() }
    });

    if (campaign) {
        await request.get(
            config.api.campaigns + campaign.name,
            t.context["cookie"]
        );

        const res = await request.get(
            config.api.secretSales + "/check",
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 200);
        t.true(res.body);
    } else {
        t.log("No campaign available. Skip test!");
        t.pass();
    }
});
