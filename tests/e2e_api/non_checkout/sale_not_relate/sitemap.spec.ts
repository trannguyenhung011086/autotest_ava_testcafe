import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as Model from "../../../../common/interface";
import * as convert from "xml-js";

let sitemapIndex: Model.Sitemap;

const helper = new Utils.Helper();
const requestBrands = new Utils.BrandUtils();
const requestMenus = new Utils.MenusUtils();
const requestMenuProducts = new Utils.MenusUtils();

import test from "ava";

// wait for WWW-672
test.before(async t => {
    const res = await helper.getPlain(config.api.sitemapIndex);
    t.deepEqual(res.statusCode, 200);

    const result: any = convert.xml2js(res.body, { compact: true });
    sitemapIndex = result;
});

test("Check sitemap index", async t => {
    await helper.validateSitemap(t, sitemapIndex);
});

test("Check sitemap brands", async t => {
    const res = await helper.getPlain(config.api.sitemapBrands);
    const result: any = convert.xml2js(res.body, { compact: true });
    const sitemapBrands: Model.Sitemap = result;

    await helper.validateSitemap(t, sitemapBrands);

    const brandList = await requestBrands.getBrandsList();

    t.deepEqual(brandList.length, sitemapBrands.urlset.url.length / 2 - 1);

    brandList.forEach(brand => {
        const check = sitemapBrands.urlset.url.some(url => {
            return (
                brand.slug ===
                url.loc._text.replace(
                    /https:\/\/www.leflair.vn\/(vn|en)\/brands\//,
                    ""
                )
            );
        });
        if (!check) {
            console.log(check, brand.slug);
        }
        t.true(check);
    });
});

test("Check sitemap categories", async t => {
    const res = await helper.getPlain(config.api.sitemapCategories);
    const result: any = convert.xml2js(res.body, { compact: true });
    const sitemapCategories: Model.Sitemap = result;

    await helper.validateSitemap(t, sitemapCategories);

    const menus = await requestMenus.getAllMenus();

    t.deepEqual(menus.length, sitemapCategories.urlset.url.length / 2);

    menus.forEach(menu => {
        const checkEN = sitemapCategories.urlset.url.some(url => {
            return (
                menu.slug.en ===
                url.loc._text.replace(/https:\/\/www.leflair.vn\/en\//, "")
            );
        });
        t.true(checkEN);

        const checkVN = sitemapCategories.urlset.url.some(url => {
            return (
                menu.slug.vn ===
                url.loc._text.replace(/https:\/\/www.leflair.vn\/vn\//, "")
            );
        });
        t.true(checkVN);
    });
});

test("Check sitemap category products", async t => {
    const menus = await requestMenus.getAllMenus();

    for (const menu of menus) {
        const products = await requestMenuProducts.getProductsByMenu(
            menu.slug.en
        );

        const res = await helper.getPlain(
            config.api.sitemapCategory + menu.id + ".xml"
        );
        const result: any = convert.xml2js(res.body, { compact: true });
        const sitemapCategory: Model.Sitemap = result;

        t.deepEqual(products.total, sitemapCategory.urlset.url.length / 2);

        products.data.forEach(product => {
            const check = sitemapCategory.urlset.url.some(url => {
                return (
                    product.slug ===
                    url.loc._text.replace(
                        /https:\/\/www.leflair.vn\/(en|vn)\/products\//,
                        ""
                    )
                );
            });
            if (!check) {
                console.log(check, menu.slug.en, product.slug);
            }
            t.true(check);
        });
    }
});
