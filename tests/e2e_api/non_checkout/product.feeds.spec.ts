import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as Model from "../../../common/interface";
import * as Papa from "papaparse";
import * as convert from "xml-js";

let googleCategories: string[]; // mapping list: https://docs.google.com/spreadsheets/d/1cL4mK-oQCrf9K0o5o21t_ChU8yDVnppxNGJmNJ3rkgw/edit#gid=2031209736

const helper = new Utils.Helper();

import test from "ava";

export function getFeedId(url: string) {
    const splitParam = url.split("?");
    let color: string;
    let id: string;

    id = splitParam[0].split("-")[splitParam[0].split("-").length - 1];

    if (splitParam[1]) {
        color = splitParam[1].split("=")[1];
        id = id + "_" + color;
    }

    return id;
}

test.before(async t => {
    const res = await helper.getPlain(
        "https://www.google.com/basepages/producttype/taxonomy.en-US.txt"
    );
    googleCategories = res.body.split("\n");
});

test("Check Facebook product feeds", async t => {
    const res = await helper.getPlain(config.api.feedFacebook);

    t.deepEqual(res.statusCode, 200);

    const parsed = Papa.parse(res.body, { header: true });
    const facebookFeeds: Model.FacebookFeeds[] = parsed.data;

    facebookFeeds.forEach(feed => {
        t.deepEqual(getFeedId(feed.link), feed.id);
        t.truthy(feed.title);
        t.truthy(feed.description);
        t.truthy(feed.brand);
        t.true(helper.validateImage(feed.image_link));

        const retail_price = parseInt(feed.price.split(" ")[0]);
        const sale_price = parseInt(feed.sale_price.split(" ")[0]);

        t.true(retail_price >= sale_price);

        const start = feed.sale_price_effective_date.split("/")[0];
        const end = feed.sale_price_effective_date.split("/")[1];

        t.true(new Date(start).getTime() < new Date(end).getTime());

        t.deepEqual(feed.availability, "in stock"); // wait for WWW-640
        t.deepEqual(feed.condition, "new");

        if (!googleCategories.includes(feed.google_product_category)) {
            console.log(feed.google_product_category);
        } // log mismatch category

        // category must comply with https://www.google.com/basepages/producttype/taxonomy.en-US.txt
        t.true(googleCategories.includes(feed.google_product_category)); // wait for WWW-641
    });

    t.deepEqual(parsed.errors.length, 0);
});

test("Check Google product feeds", async t => {
    const res = await helper.getPlain(config.api.feedGoogle);

    t.deepEqual(res.statusCode, 200);

    const parsed = Papa.parse(res.body, { header: true });
    const googleFeeds: Model.GoogleFeeds[] = parsed.data;

    googleFeeds.forEach(feed => {
        t.truthy(feed["Custom label"]);
        t.true(
            feed["Page URL"].includes("https://www.leflair.vn/vn/products/")
        );
    });

    t.deepEqual(parsed.errors.length, 0);
});

test("Check Google dynamic product feeds", async t => {
    const res = await helper.getPlain(config.api.feedGoogleDynamic);

    t.deepEqual(res.statusCode, 200);

    const parsed = Papa.parse(res.body, { header: true });
    const googleDynamicFeeds: Model.GoogleDynamicFeeds[] = parsed.data;

    googleDynamicFeeds.forEach(feed => {
        t.deepEqual(getFeedId(feed["Final URL"]), feed.ID);
        t.deepEqual(getFeedId(feed["Final mobile URL"]), feed.ID);
        t.true(helper.validateImage(feed["Image URL"]));
        t.truthy(feed["Item category"]);
        t.truthy(feed["Item description"]);
        t.truthy(feed["Item title"]);

        const retail_price = parseInt(feed.Price.split(" ")[0]);
        const sale_price = parseInt(feed["Sale price"].split(" ")[0]);

        t.true(retail_price >= sale_price);
    });

    t.deepEqual(parsed.errors.length, 0);
});

test("Check Criteo product feeds v1", async t => {
    const res = await helper.getPlain(config.api.feedCriteo);

    t.deepEqual(res.statusCode, 200);

    const parsed = Papa.parse(res.body, { header: true });
    const criteoFeeds: Model.CriteoFeeds[] = parsed.data;

    criteoFeeds.forEach(feed => {
        t.deepEqual(getFeedId(feed.producturl), feed.id);
        t.true(helper.validateImage(feed.bigimage));
        t.truthy(feed.category);
        t.truthy(feed.description);
        t.deepEqual(feed.instock, "true"); // wait for WWW-640
        t.truthy(feed.name);
        t.truthy(feed.extra_brand);

        const retail_price = parseInt(feed.retailprice);
        const sale_price = parseInt(feed.price);

        t.true(retail_price >= sale_price);

        if (feed.producturl.includes("?color=")) {
            t.true(decodeURI(feed.id).includes(feed.extra_color));
            t.true(decodeURI(feed.producturl).includes(feed.extra_color));
        }
        if (feed.producturl.includes("?size=")) {
            t.true(decodeURI(feed.id).includes(feed.extra_size));
            t.true(decodeURI(feed.producturl).includes(feed.extra_size));
        }
    });

    t.deepEqual(parsed.errors.length, 0);
});

// need to improve Criteo feeds format later
test.skip("Check Criteo product feeds v2", async t => {
    const res = await helper.getPlain(config.api.feedCriteo);

    t.deepEqual(res.statusCode, 200);

    const parsed = Papa.parse(res.body, { header: true });
    const criteoFeeds2: Model.CriteoFeeds2[] = parsed.data;

    criteoFeeds2.forEach(feed => {
        t.true(feed.id.length < 240);
        t.truthy(feed.title);
        t.truthy(feed.description);

        // category must comply with https://www.google.com/basepages/producttype/taxonomy.en-US.txt
        t.true(googleCategories.includes(feed.google_product_category));

        t.deepEqual(getFeedId(feed.link), feed.id);

        if (feed.link.includes("?color=")) {
            t.true(decodeURI(feed.id).includes(feed.color));
            t.true(decodeURI(feed.link).includes(feed.color));
        }
        if (feed.link.includes("?size=")) {
            t.true(decodeURI(feed.id).includes(feed.size));
            t.true(decodeURI(feed.link).includes(feed.size));
        }

        t.true(helper.validateImage(feed.image_link));

        t.deepEqual(feed.availability, "in stock");

        const retail_price = parseInt(feed.price);
        const sale_price = parseInt(feed.sale_price);

        t.true(retail_price >= sale_price);

        t.truthy(feed.brand);
        t.truthy(feed.product_type);
        t.regex(feed.adult, /yes|no/);
        t.deepEqual(feed.condition, "new");
        t.regex(feed.age_group, /newborn|infant|toddler|kids|adult/);
    });

    t.deepEqual(parsed.errors.length, 0);
});

test("Check Google Merchant product feeds", async t => {
    const res = await helper.getPlain(config.api.feedGoogleMerchant);

    t.deepEqual(res.statusCode, 200);

    const result: any = convert.xml2js(res.body, { compact: true });
    const googleMerchantFeeds: Model.GoogleMerchantFeeds = result;

    t.deepEqual(googleMerchantFeeds._declaration._attributes.version, "1.0");
    t.deepEqual(googleMerchantFeeds._declaration._attributes.encoding, "UTF-8");
    t.deepEqual(
        googleMerchantFeeds.feed._attributes.xmlns,
        "http://www.w3.org/2005/Atom"
    );
    t.deepEqual(
        googleMerchantFeeds.feed._attributes["xmlns:g"],
        "http://base.google.com/ns/1.0"
    );

    googleMerchantFeeds.feed.entry.forEach(entry => {
        t.true(entry["g:id"]._text.length <= 50);
        t.true(entry["g:title"]._text.length <= 150); // wait for www-643
        t.truthy(entry["g:description"]._text);

        t.deepEqual(getFeedId(entry["g:link"]._text), entry["g:id"]._text);

        if (entry["g:link"]._text.includes("?color=")) {
            t.true(
                decodeURI(entry["g:id"]._text).includes(entry["g:color"]._text)
            );
            t.true(
                decodeURI(entry["g:link"]._text).includes(
                    entry["g:color"]._text
                )
            );
        }
        if (entry["g:link"]._text.includes("?size=")) {
            t.true(
                decodeURI(entry["g:id"]._text).includes(entry["g:size"]._text)
            );
            t.true(
                decodeURI(entry["g:link"]._text).includes(entry["g:size"]._text)
            );
        }

        t.true(helper.validateImage(entry["g:image_link"]._text));

        t.deepEqual(entry["g:availability"]._text, "in stock"); // wait for WWW-640

        const retail_price = parseInt(entry["g:price"]._text);
        const sale_price = parseInt(entry["g:sale_price"]._text);

        t.true(retail_price >= sale_price);

        if (
            !googleCategories.includes(entry["g:google_product_category"]._text)
        ) {
            console.log(entry["g:google_product_category"]._text);
        } // log mismatch category

        // category must comply with https://www.google.com/basepages/producttype/taxonomy.en-US.txt
        t.true(
            googleCategories.includes(entry["g:google_product_category"]._text)
        ); // wait for WWW-641

        t.truthy(entry["g:product_type"]._text);
        t.truthy(entry["g:brand"]._text);
        t.truthy(entry["g:mpn"]._text);
        t.deepEqual(entry["g:condition"]._text, "new");
        t.regex(entry["g:adult"]._text, /yes|no/); // wait for www-643
        t.regex(entry["g:is_bundle"]._text, /yes|no/); // wait for www-643

        if (entry["g:multipack"]) {
            t.true(parseInt(entry["g:multipack"]._text) > 1);
        } // wait for www-643

        if (entry["g:gender"]._text) {
            t.regex(entry["g:gender"]._text, /male|female|unisex/);
        }

        if (entry["g:age_group"]._text) {
            t.regex(
                entry["g:age_group"]._text,
                /newborn|infant|toddler|kids|adult/
            );
        }

        t.true(entry.hasOwnProperty("g:gtin"));
        t.true(entry.hasOwnProperty("g:material"));
        t.true(entry.hasOwnProperty("g:pattern"));
        t.true(entry.hasOwnProperty("g:color"));
        t.true(entry.hasOwnProperty("g:size"));
        t.true(entry.hasOwnProperty("g:item_group_id"));
        t.true(entry.hasOwnProperty("g:shipping"));
        t.true(entry.hasOwnProperty("g:tax"));
    });
});

test("Check Insider product feeds", async t => {
    const res = await helper.getPlain(config.api.feedInsider);

    t.deepEqual(res.statusCode, 200);

    const result: any = convert.xml2js(res.body, { compact: true });
    const insiderFeeds: Model.InsiderFeeds = result;

    t.deepEqual(insiderFeeds._declaration._attributes.version, "1.0");
    t.deepEqual(insiderFeeds._declaration._attributes.encoding, "UTF-8");
    t.deepEqual(
        insiderFeeds.products._attributes.xmlns,
        "http://www.w3.org/2005/Atom"
    );

    insiderFeeds.products.product.forEach(product => {
        t.deepEqual(getFeedId(product.link._text), product.id._text);
        t.truthy(product.title._text);
        t.true(helper.validateImage(product.image_url._text));
        t.truthy(product.description._text);
        t.truthy(product.category._text);
        t.deepEqual(product.instock._text, "true"); // wait for WWW-640
        t.truthy(product.extra_brand._text);

        const retail_price = parseInt(product.price._text);
        const sale_price = parseInt(product.sale_price._text);

        t.true(retail_price >= sale_price);
    });
});

test("Check RTB House product feeds", async t => {
    const res = await helper.getPlain(config.api.feedRtbHouse);

    t.deepEqual(res.statusCode, 200);

    const parsed = Papa.parse(res.body, { header: true });
    const rtbFeeds: Model.RtbHouseFeeds[] = parsed.data;

    rtbFeeds.forEach(feed => {
        t.deepEqual(getFeedId(feed.producturl), feed.id);
        t.truthy(feed.name);
        t.truthy(feed.description);
        t.true(helper.validateImage(feed.bigimage));

        const retail_price = parseInt(feed.retailprice);
        const sale_price = parseInt(feed.price);

        t.true(retail_price >= sale_price);

        t.deepEqual(feed.instock, "true"); // wait for WWW-640

        t.truthy(feed.category);
        t.truthy(feed.extra_brand);

        t.true(feed.extra_color.length >= 0);
        t.true(feed.extra_size.length >= 0);

        if (feed.producturl.includes("?color=")) {
            t.true(feed.id.includes(feed.extra_color));
            t.true(feed.producturl.includes(feed.extra_color));
        }
        if (feed.producturl.includes("?size=")) {
            t.true(feed.id.includes(feed.extra_size));
            t.true(feed.producturl.includes(feed.extra_size));
        }
    });

    t.deepEqual(parsed.errors.length, 0);
});
