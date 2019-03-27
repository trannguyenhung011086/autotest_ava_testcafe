import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as Model from "../../../../common/interface";

const request = new Utils.Helper();
const access = new Utils.DbAccessUtils();

import test from "ava";

test("Get 200 success code when accessing valid campaign name", async t => {
    const campaign: Model.Campaign = await access.getCampaign({
        endDate: { $gt: new Date() }
    });

    if (campaign) {
        let res = await request.get(config.api.campaigns + campaign.name);

        t.deepEqual(res.statusCode, 200);
        t.deepEqual(res.body.message, "SET");
        t.snapshot(res.body);

        res = await request.get(config.api.campaigns + campaign.name);

        t.deepEqual(res.statusCode, 200);
        t.deepEqual(res.body.message, "NO_CHANGE");
        t.snapshot(res.body);
    } else {
        t.log("No campaign available. Skip test!");
        t.pass();
    }
});

test("Get 404 error code when accessing invalid campaign name", async t => {
    const res = await request.get(config.api.campaigns + "INVALID-CAMPAIGN");

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "NOT_FOUND");
    t.snapshot(res.body);
});

test("Get 404 error code when accessing missing campaign name", async t => {
    const res = await request.get(config.api.campaigns);

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "Not found");
    t.snapshot(res.body);
});
