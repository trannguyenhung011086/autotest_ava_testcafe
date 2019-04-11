import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as Model from "../../../../common/interface";

const request = new Utils.MenusUtils();

const topMenuIds = [
    "5b56d3448f0dd7c0480acd1b", // apparel
    "5b56d3448f0dd7c0480acd1f", // bags & shoes
    "5b56d3448f0dd7c0480acd28", // accessories
    "5b56d3448f0dd7c0480acd32", // health & beauty
    "5b62d1008f0dd7c0480acd5b", // home & lifestyle
    "5c98a49e4e1e9aba4dae9912" // international
];
const topMenuSlugEn = [
    "apparel",
    "bags-and-shoes",
    "accessories",
    "health-and-beauty",
    "home-and-lifestyle",
    "international"
];
const topMenuSlugVn = [
    "thoi-trang",
    "tui-xach-and-giay-dep",
    "phu-kien",
    "suc-khoe-and-lam-dep",
    "nha-cua-and-doi-song",
    "international"
];

let allMenus: Model.Menus[];
let menusExInt: Model.Menus[];

import test from "ava";

test.before(async t => {
    allMenus = await request.getAllMenus();
    t.truthy(allMenus);

    menusExInt = allMenus.reduce((result, value) => {
        if (value.slug.en != "international") {
            result.push(value);
        }
        return result;
    }, []);
    t.truthy(menusExInt);
});

// get menu

test("Get all top menus excluding breadcrumbs", async t => {
    const res = await request.get(config.api.menus + "/top");
    const menus: Model.Menus[] = res.body;
    t.truthy(menus);

    menus.forEach(menu => {
        t.truthy(menu.displayName.en);
        t.truthy(menu.displayName.vn);
        t.truthy(menu.slug.en);
        t.truthy(menu.slug.vn);
        t.true(topMenuIds.includes(menu.id));
    });
});

test("Get all menus", async t => {
    allMenus.forEach(menu => request.validateMenus(t, menu));
});

test("Get all top menus", async t => {
    const menus = await request.getMenus("top");
    t.truthy(menus);

    menus.forEach(menu => {
        request.validateMenus(t, menu);
        t.falsy(menu.parentId);
        t.true(topMenuIds.includes(menu.id));
    });
});

test("Get all sub menus", async t => {
    const menus = await request.getMenus("sub");
    t.truthy(menus);

    menus.forEach(menu => {
        request.validateMenus(t, menu);
        t.truthy(menu.parentId);
        t.false(topMenuIds.includes(menu.id));
    });
});

test("Get 400 error code when get menu using invalid menu", async t => {
    const res = await request.get(config.api.menus + "invalid");

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "NOT_FOUND");
    t.snapshot(res.body);
});

test("Get each menu using menu ID", async t => {
    for (const item of allMenus) {
        const res = await request.get(config.api.menus + item.id);
        const menu: Model.Menus = res.body;
        t.truthy(menu);

        await request.validateMenus(t, menu);

        if (!menu.parentId) {
            t.true(topMenuIds.includes(menu.id));
        } else {
            t.false(topMenuIds.includes(menu.id));
        }
    }
});

test("Get each menu using menu EN slug", async t => {
    for (const item of allMenus) {
        const res = await request.get(config.api.menus + item.slug.en);
        const menu: Model.Menus = res.body;
        t.truthy(menu);

        await request.validateMenus(t, menu);

        if (!menu.parentId) {
            t.true(topMenuSlugEn.includes(menu.slug.en));
        } else {
            t.false(topMenuSlugEn.includes(menu.slug.en));
        }
    }
});

test("Get each menu using menu VN slug", async t => {
    for (const item of allMenus) {
        const res = await request.get(config.api.menus + item.slug.vn);
        const menu: Model.Menus = res.body;
        t.truthy(menu);

        await request.validateMenus(t, menu);

        if (!menu.parentId) {
            t.true(topMenuSlugVn.includes(menu.slug.vn));
        } else {
            t.false(topMenuSlugVn.includes(menu.slug.vn));
        }
    }
});

// get sales by menu

test("Get 400 error when get sales by menu using menu ID", async t => {
    for (const menu of allMenus) {
        const res = await request.get(config.api.menuSales + menu.id);

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "MENU_NOT_FOUND");
        t.snapshot(res.body);
    }
});

test("Get 400 error when get sales by menu using invalid menu", async t => {
    const res = await request.get(config.api.menuSales + "invalid");

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MENU_NOT_FOUND");
    t.snapshot(res.body);
});

test("Get sales by menu using menu EN slug", async t => {
    for (const menu of allMenus) {
        const sales = await request.getSalesByMenu(menu.slug.en);

        if (sales.length == 0) {
            t.log(menu.slug.en + " has no sale!");
            t.pass();
        } else {
            sales.forEach(sale => {
                request.validateSale(t, sale);
            });
        }
    }
});

test("Get sales by menu using menu VN slug", async t => {
    for (const menu of allMenus) {
        const sales = await request.getSalesByMenu(menu.slug.vn);

        if (sales.length == 0) {
            t.log(menu.slug.vn + " has no sale!");
            t.pass();
        } else {
            sales.forEach(sale => {
                request.validateSale(t, sale);
            });
        }
    }
});

test("Get featured sales by menu", async t => {
    for (const menu of menusExInt) {
        const sales = await request.getSalesByMenu(
            menu.slug.vn + "?featured=true"
        );

        if (sales.length == 0) {
            t.log("There is no featured sale for menu " + menu.slug.vn);
            t.pass();
        } else {
            sales.forEach(sale => {
                request.validateSale(t, sale);
            });
        }
    }
});

test("Get today sales by menu", async t => {
    for (const menu of menusExInt) {
        const sales = await request.getSalesByMenu(
            menu.slug.vn + "?today=true"
        );

        if (sales.length == 0) {
            t.log("There is no today sale for menu " + menu.slug.vn);
            t.pass();
        } else {
            sales.forEach(sale => {
                request.validateSale(t, sale);
            });
        }
    }
});

test("Get featured today sales by menu", async t => {
    for (const menu of menusExInt) {
        const sales = await request.getSalesByMenu(
            menu.slug.vn + "?today=true&featured=true"
        );

        if (sales.length == 0) {
            t.log("There is no featured today sale for menu " + menu.slug.vn);
            t.pass();
        } else {
            sales.forEach(sale => {
                request.validateSale(t, sale);
            });
        }
    }
});

test("Get sales by menu excluding sale ID", async t => {
    for (const menu of menusExInt) {
        const sales = await request.getSalesByMenu(menu.slug.vn);

        if (sales.length == 0) {
            continue;
        }

        const filteredSales = await request.getSalesByMenu(
            menu.slug.en + "?excludeId=" + sales[0].id
        );
        t.truthy(filteredSales);

        filteredSales.forEach(sale => {
            t.notDeepEqual(sale.id, sales[0].id);
            request.validateSale(t, sale);
        });
    }
});

test("Get future sales by menu using previewOffset", async t => {
    for (const menu of menusExInt) {
        const sales = await request.getSalesByMenu(menu.slug.vn);

        if (sales.length == 0) {
            continue;
        }

        const futureSales = await request.getSalesByMenu(
            menu.slug.vn + "?previewOffset=7"
        );
        t.truthy(futureSales);

        sales.forEach(sale => {
            futureSales.forEach(future => {
                t.notDeepEqual(sale.id, future.id);
            });
        });
    }
});

// get products by menu

test("Get 400 error when get products by menu using menu ID", async t => {
    for (const menu of allMenus) {
        const res = await request.get(config.api.menuProducts + menu.id);

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "MENU_NOT_FOUND");
        t.snapshot(res.body);
    }
});

test("Get 400 error when get products by menu using invalid menu", async t => {
    const res = await request.get(config.api.menuProducts + "invalid");

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MENU_NOT_FOUND");
    t.snapshot(res.body);
});

test("Get products by menu using menu EN slug", async t => {
    for (const menu of allMenus) {
        const products = await request.getProductsByMenu(menu.slug.en);

        if (menu.slug.en == "international") {
            t.deepEqual(products.data.length, 0);
            t.deepEqual(products.total, 0);
        } else {
            products.data.forEach(product => {
                request.validateMenuProduct(t, product);
            });

            t.true(products.data.length > 0);
            t.true(products.total > 0);
        }
    }
});

test("Get products by menu using menu VN slug", async t => {
    for (const menu of allMenus) {
        const products = await request.getProductsByMenu(menu.slug.vn);

        if (menu.slug.vn == "international") {
            t.deepEqual(products.data.length, 0);
            t.deepEqual(products.total, 0);
        } else {
            products.data.forEach(product => {
                request.validateMenuProduct(t, product);
            });

            t.true(products.data.length > 0);
            t.true(products.total > 0);
        }
    }
});

test("Get products by menu using pageSize", async t => {
    for (const menu of menusExInt) {
        const products = await request.getProductsByMenu(
            menu.slug.en + "?pageSize=20"
        );

        products.data.forEach(product => {
            request.validateMenuProduct(t, product);
        });

        t.true(products.total > 0);

        if (products.total >= 20) {
            t.true(products.data.length <= 20);
        }
    }
});

test("Get all products by menu using pageSize = -1", async t => {
    for (const menu of menusExInt) {
        const products = await request.getProductsByMenu(
            menu.slug.en + "?pageSize=-1"
        );

        t.deepEqual(products.total, products.data.length);
    }
});

test("Get products by menu using pageIndex", async t => {
    for (const menu of menusExInt) {
        const products = await request.getProductsByMenu(
            menu.slug.en + "?pageSize=10"
        );
        const productsIndex1 = await request.getProductsByMenu(
            menu.slug.en + "?pageSize=10&pageIndex=1"
        );
        const productsIndex2 = await request.getProductsByMenu(
            menu.slug.en + "?pageSize=10&pageIndex=2"
        );

        if (products.total > 10) {
            productsIndex1.data.forEach(productIndex1 => {
                productsIndex2.data.forEach(productIndex2 => {
                    t.notDeepEqual(productIndex1.id, productIndex2.id);
                });
            });
        }
    }
});

test("Get future products by menu using previewOffset", async t => {
    for (const menu of menusExInt) {
        const products = await request.getProductsByMenu(menu.slug.en);

        if (products.data.length == 0) {
            continue;
        }

        const futureProducts = await request.getProductsByMenu(
            menu.slug.en + "?previewOffset=7"
        );
        t.truthy(futureProducts);

        products.data.forEach(product => {
            futureProducts.data.forEach(future => {
                t.notDeepEqual(product.id, future.id);
            });
        });
    }
});

// get product variations by menu

test("Get 400 error when get product variations by menu using menu ID", async t => {
    for (const menu of allMenus) {
        const res = await request.get(
            config.api.menuProductVariations + menu.id
        );

        t.deepEqual(res.statusCode, 400);
        t.deepEqual(res.body.message, "MENU_NOT_FOUND");
        t.snapshot(res.body);
    }
});

test("Get 400 error when get product variations by menu using invalid menu", async t => {
    const res = await request.get(config.api.menuProductVariations + "invalid");

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MENU_NOT_FOUND");
    t.snapshot(res.body);
});

test("Get product variations by menu using menu EN slug", async t => {
    for (const menu of allMenus) {
        const products = await request.getProductVariationsByMenu(menu.slug.en);

        if (menu.slug.en == "international") {
            t.deepEqual(products.data.length, 0);
            t.deepEqual(products.total, 0);
        } else {
            products.data.forEach(product => {
                request.validateMenuProductVariation(t, product);
            });

            t.true(products.data.length > 0);
            t.true(products.total > 0);
        }
    }
});

test("Get product variations by menu using menu VN slug", async t => {
    for (const menu of allMenus) {
        const products = await request.getProductVariationsByMenu(menu.slug.vn);

        if (menu.slug.vn == "international") {
            t.deepEqual(products.data.length, 0);
            t.deepEqual(products.total, 0);
        } else {
            products.data.forEach(product => {
                request.validateMenuProductVariation(t, product);
            });

            t.true(products.data.length > 0);
            t.true(products.total > 0);
        }
    }
});

test("Get product variations by menu using pageSize", async t => {
    for (const menu of menusExInt) {
        const products = await request.getProductVariationsByMenu(
            menu.slug.en + "?pageSize=20"
        );

        products.data.forEach(product => {
            request.validateMenuProductVariation(t, product);
        });

        t.true(products.total > 0);

        if (products.total >= 20) {
            t.true(products.data.length >= 20);
        }
    }
});

test("Get all product variations by menu using pageSize = -1", async t => {
    for (const menu of menusExInt) {
        const products = await request.getProductVariationsByMenu(
            menu.slug.en + "?pageSize=-1"
        );

        t.true(products.data.length >= products.total);
    }
});

test("Get product variations by menu using pageIndex", async t => {
    for (const menu of menusExInt) {
        const products = await request.getProductVariationsByMenu(
            menu.slug.en + "?pageSize=10"
        );
        const productsIndex1 = await request.getProductVariationsByMenu(
            menu.slug.en + "?pageSize=10&pageIndex=1"
        );
        const productsIndex2 = await request.getProductVariationsByMenu(
            menu.slug.en + "?pageSize=10&pageIndex=2"
        );

        if (products.total > 10) {
            productsIndex1.data.forEach(productIndex1 => {
                productsIndex2.data.forEach(productIndex2 => {
                    t.notDeepEqual(productIndex1.id, productIndex2.id);
                });
            });
        }
    }
});

test("Get empty product variations by menu using previewOffset", async t => {
    for (const menu of menusExInt) {
        const products = await request.getProductVariationsByMenu(
            menu.slug.en + "?previewOffset=7"
        );
        t.deepEqual(products.data.length, 0);
    }
});
