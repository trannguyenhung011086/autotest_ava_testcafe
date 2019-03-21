import { t, RequestMock } from "testcafe";
import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import { Pages } from "../page_objects";

const requestSale = new Utils.SaleUtils();
const page = new Pages();

const mockRedirect = RequestMock()
    .onRequestTo(/\/api\/v2\/product\/(?!view-product)/)
    .respond({ code: 403 }, 403, { "access-control-allow-origin": "*" });

const mockNonRedirect = RequestMock()
    .onRequestTo(/\/api\/v2\/product\/(?!view-product)/)
    .respond(null, 500, { "access-control-allow-origin": "*" });

fixture("Check product detail page redirect").meta({
    type: "regression"
});

test.skip.requestHooks(mockRedirect)(
    "Redirect to homepage when product API returns 403 error code",
    async () => {
        const sales = await requestSale.getSales(config.api.featuredSales);

        await t
            .navigateTo(config.baseUrl + "/vn/sales/" + sales[0].slug)
            .click(".product-card");

        const location = await t.eval(() => document.location.href);
        await t.expect(location).eql(config.baseUrl + "/vn");
    }
);

test.skip.requestHooks(mockNonRedirect)(
    "Not redirect to homepage when product API returns 500 error code",
    async () => {
        const sales = await requestSale.getSales(config.api.featuredSales);

        await t
            .navigateTo(config.baseUrl + "/vn/sales/" + sales[0].slug)
            .click(".product-card");

        const location = await t.eval(() => document.location.href);
        await t.expect(location).notEql(config.baseUrl + "/vn");
    }
);
