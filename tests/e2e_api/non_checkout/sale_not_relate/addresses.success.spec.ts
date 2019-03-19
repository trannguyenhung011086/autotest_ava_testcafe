import { config } from "../../../../common/config";
import * as Utils from "../../../../common/utils";
import * as Model from "../../../../common/interface";

let cities: Model.City[];
let districts: Model.District[];

const request = new Utils.AddressUtils();

import test from "ava";

test.before(async t => {
    cities = await request.getCities();
});

test.beforeEach(async t => {
    t.context["cookie"] = await request.pickRandomUser(
        config.testAccount.email_ex
    );
});

test.serial("GET / all cities", async t => {
    const res = await request.get(config.api.addresses + "/cities");

    cities = res.body;

    t.deepEqual(res.statusCode, 200);

    cities.forEach(city => {
        t.truthy(city.id);
        t.truthy(city.name);
    });
});

test.serial("GET / all districts of each city", async t => {
    for (const city of cities) {
        const res = await request.get(
            config.api.addresses + "/cities/" + city.id + "/districts"
        );

        districts = res.body;

        t.deepEqual(res.statusCode, 200);

        districts.forEach(district => {
            t.truthy(district.id);
            t.truthy(district.name);
        });
    }
});

test.serial("GET / all addresses", async t => {
    const res = await request.get(config.api.addresses, t.context["cookie"]);

    const addresses: Model.Addresses = res.body;

    t.deepEqual(res.statusCode, 200);
    t.truthy(addresses.billing);
    t.truthy(addresses.shipping);
});

test("POST / add new shipping address (not duplicated billing address)", async t => {
    const shipping = await request.generateAddress("shipping", cities);
    shipping.duplicateBilling = false;

    const res = await request.post(
        config.api.addresses,
        shipping,
        t.context["cookie"]
    );

    const addresses: Model.Addresses = res.body;

    t.deepEqual(res.statusCode, 200);
    t.truthy(addresses.shipping[0].id);
    t.deepEqual(addresses.shipping[0].address, shipping.address);
    t.deepEqual(addresses.shipping[0].city, shipping.city);
    t.true(addresses.shipping[0].default);
    t.deepEqual(addresses.shipping[0].district, shipping.district);
    t.deepEqual(addresses.shipping[0].firstName, shipping.firstName);
    t.deepEqual(addresses.shipping[0].lastName, shipping.lastName);
    t.deepEqual(addresses.shipping[0].phone, shipping.phone);
});

test("POST / add new shipping address (duplicated billing address)", async t => {
    const shipping = await request.generateAddress("shipping", cities);
    shipping.duplicateBilling = true;

    const res = await request.post(
        config.api.addresses,
        shipping,
        t.context["cookie"]
    );

    const addresses: Model.Addresses = res.body;

    t.deepEqual(res.statusCode, 200);

    t.truthy(addresses.shipping[0].id);
    t.deepEqual(addresses.shipping[0].address, shipping.address);
    t.deepEqual(addresses.shipping[0].city, shipping.city);
    t.true(addresses.shipping[0].default);
    t.deepEqual(addresses.shipping[0].district, shipping.district);
    t.deepEqual(addresses.shipping[0].firstName, shipping.firstName);
    t.deepEqual(addresses.shipping[0].lastName, shipping.lastName);
    t.deepEqual(addresses.shipping[0].phone, shipping.phone);

    t.truthy(addresses.billing[0].id);
    t.deepEqual(addresses.billing[0].address, shipping.address);
    t.deepEqual(addresses.billing[0].city, shipping.city);
    t.true(addresses.billing[0].default);
    t.deepEqual(addresses.billing[0].district, shipping.district);
    t.deepEqual(addresses.billing[0].firstName, shipping.firstName);
    t.deepEqual(addresses.billing[0].lastName, shipping.lastName);
    t.deepEqual(addresses.billing[0].phone, shipping.phone);
});

test("POST / add new billing address", async t => {
    const billing = await request.generateAddress("billing", cities);
    const res = await request.post(
        config.api.addresses,
        billing,
        t.context["cookie"]
    );

    const addresses: Model.Addresses = res.body;

    t.deepEqual(res.statusCode, 200);
    t.truthy(addresses.billing[0].id);
    t.deepEqual(addresses.billing[0].address, billing.address);
    t.deepEqual(addresses.billing[0].city, billing.city);
    t.true(addresses.billing[0].default);
    t.deepEqual(addresses.billing[0].district, billing.district);
    t.deepEqual(addresses.billing[0].firstName, billing.firstName);
    t.deepEqual(addresses.billing[0].lastName, billing.lastName);
    t.deepEqual(addresses.billing[0].phone, billing.phone);
    t.deepEqual(addresses.billing[0].companyName, billing.companyName);
    t.deepEqual(addresses.billing[0].taxCode, billing.taxCode);
});

test("PUT / update shipping address", async t => {
    const addresses: Model.Addresses = await request.getAddresses(
        t.context["cookie"]
    );

    const newShipping = await request.generateAddress("shipping", cities);
    newShipping.id = addresses.shipping[0].id;

    let res = await request.put(
        config.api.addresses + "/" + addresses.shipping[0].id,
        newShipping,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 200);

    res = await request.get(
        config.api.addresses + "/" + addresses.shipping[0].id,
        t.context["cookie"]
    );

    const address: Model.Shipping = res.body;

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(address.id, newShipping.id);
    t.deepEqual(address.address, newShipping.address);
    t.deepEqual(address.city, newShipping.city);
    t.deepEqual(address.default, newShipping.default);
    t.deepEqual(address.district, newShipping.district);
    t.deepEqual(address.firstName, newShipping.firstName);
    t.deepEqual(address.lastName, newShipping.lastName);
    t.deepEqual(address.phone, newShipping.phone);
});

test("PUT / update billing address", async t => {
    const addresses: Model.Addresses = await request.getAddresses(
        t.context["cookie"]
    );

    const newBilling = await request.generateAddress("billing", cities);
    newBilling.id = addresses.billing[0].id;
    newBilling.taxCode = "0789456321";

    let res = await request.put(
        config.api.addresses + "/" + addresses.billing[0].id,
        newBilling,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 200);

    res = await request.get(
        config.api.addresses + "/" + addresses.billing[0].id,
        t.context["cookie"]
    );

    const address: Model.Billing = res.body;

    t.deepEqual(res.statusCode, 200);
    t.deepEqual(address.id, newBilling.id);
    t.deepEqual(address.address, newBilling.address);
    t.deepEqual(address.city, newBilling.city);
    t.deepEqual(address.default, newBilling.default);
    t.deepEqual(address.district, newBilling.district);
    t.deepEqual(address.firstName, newBilling.firstName);
    t.deepEqual(address.lastName, newBilling.lastName);
    t.deepEqual(address.phone, newBilling.phone);
    t.deepEqual(address.companyName, newBilling.companyName);
    t.deepEqual(address.taxCode, newBilling.taxCode);
});

test("DELETE / delete shipping address", async t => {
    const addresses: Model.Addresses = await request.getAddresses(
        t.context["cookie"]
    );
    const toDeleteId = addresses.shipping[0].id;

    if (addresses.shipping.length > 0) {
        const res = await request.delete(
            config.api.addresses + "/" + toDeleteId,
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 200);
        t.snapshot(res.body);
    }

    const updatedAddresses: Model.Addresses = await request.getAddresses(
        t.context["cookie"]
    );

    for (const shipping of updatedAddresses.shipping) {
        t.notDeepEqual(shipping.id, toDeleteId);
    }
});

test("DELETE / delete billing address", async t => {
    const addresses: Model.Addresses = await request.getAddresses(
        t.context["cookie"]
    );
    const toDeleteId = addresses.billing[0].id;

    if (addresses.billing.length > 0) {
        const res = await request.delete(
            config.api.addresses + "/" + toDeleteId,
            t.context["cookie"]
        );

        t.deepEqual(res.statusCode, 200);
        t.snapshot(res.body);
    }

    const updatedAddresses: Model.Addresses = await request.getAddresses(
        t.context["cookie"]
    );

    for (const billing of updatedAddresses.billing) {
        t.notDeepEqual(billing.id, toDeleteId);
    }
});

// test('generate fake addressess', async t => {
//     for (const email of config.testAccount.email_ex) {
//         t.context['cookie'] = await request.getLogInCookie(email,
//             config.testAccount.password_ex)
//         cities = await request.getCities()
//         const shipping = await request.generateAddress('shipping', cities)
//         shipping.duplicateBilling = true

//         const res = await request.post(config.api.addresses, shipping, t.context['cookie'])
//         const addresses: Model.Addresses = res.body
//         t.log(email, addresses)
//         t.deepEqual(res.statusCode, 200)
//     }
// })
