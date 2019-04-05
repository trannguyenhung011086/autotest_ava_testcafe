import { t } from "testcafe";
import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import { Pages } from "../page_objects";

const requestProduct = new Utils.ProductUtils();
const page = new Pages();

fixture("Check product detail page").meta({
    type: "regression"
});

test.skip("Check product info returned from API. See WWW-456", async () => {
    // TO DO
});

test("Check lead time not display for sold out product", async () => {
    const product = await requestProduct.getSoldOutProductInfo(
        config.api.currentSales
    );

    await t
        .navigateTo(config.baseUrl + "/en/products/" + product.id)
        .expect(page.product.leadTime.exists)
        .notOk();
});

test("Check lead time display for virtual product", async () => {
    const product = await requestProduct.getVirtualProductInfo("SG", true);

    const calculateLeadTime = requestProduct.calculateLeadTime(
        product.products[0].isVirtual,
        "SG"
    );
    const from = calculateLeadTime.from.day + " " + calculateLeadTime.from.date;
    const to = calculateLeadTime.to.day + " " + calculateLeadTime.to.date;

    await t
        .navigateTo(config.baseUrl + "/en/products/" + product.id)
        .expect(page.product.leadTime.visible)
        .ok();

    const leadTime = await page.product.getLeadTime();
    await t.expect(leadTime).eql(from + " - " + to);
});

test("Check lead time display for non-virtual product", async () => {
    const product = await requestProduct.getVirtualProductInfo("SG", false);

    const calculateLeadTime = requestProduct.calculateLeadTime(
        product.products[0].isVirtual,
        "SG"
    );
    const from = calculateLeadTime.from.day + " " + calculateLeadTime.from.date;
    const to = calculateLeadTime.to.day + " " + calculateLeadTime.to.date;

    await t
        .navigateTo(config.baseUrl + "/en/products/" + product.id)
        .expect(page.product.leadTime.visible)
        .ok();

    const leadTime = await page.product.getLeadTime();
    await t.expect(leadTime).eql(from + " - " + to);
});
