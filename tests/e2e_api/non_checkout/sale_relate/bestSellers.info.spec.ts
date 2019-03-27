import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";

const request = new Utils.BestSellersUtils();

import test from "ava";

test("Check best sellers", async t => {
    const items = await request.getBestSellers();

    t.true(items.length > 0);
    t.deepEqual.skip(items.length, 16); // wait for WWW-238

    items.forEach(item => {
        t.truthy(item.id);
        t.truthy(item.title);
        t.truthy(item.brand);
        t.true(item.retailPrice >= item.salePrice);
        t.truthy(item.category);
        t.true(request.validateImage(item.image));
        t.true(request.validateImage(item.image2));
        t.deepEqual(typeof item.cr, "number");
        t.true(item.slug.includes(item.id));
        t.deepEqual(typeof item.international, "boolean");
        t.truthy(item.nsId);
        t.true(item.quantity >= 0);
        t.truthy(item.variation);
        t.truthy(item.variationId);
        t.true(parseInt(item.views) >= 0);
    });
});
