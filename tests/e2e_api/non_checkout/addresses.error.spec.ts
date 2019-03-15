import { config } from "../../../common/config";
import * as Utils from "../../../common/utils";
import * as faker from "faker/locale/vi";
import * as Model from "../../../common/interface";

let city: Model.City;
let district: Model.District;
let address: Model.Shipping;
let addresses: Model.Addresses;

const request = new Utils.AddressUtils();

import test from "ava";

test.before(async t => {
    const cities = await request.getCities();
    city = await request.getCity(cities);
    const districts = await request.getDistricts(city.id);
    district = await request.getDistrict(districts);
});

test.beforeEach(async t => {
    // t.context["cookie"] = await request.pickRandomUser(
    //     config.testAccount.email_ex
    // );

    t.context["cookie"] = await request.getLogInCookie(
        config.testAccount.email_in,
        config.testAccount.password_in
    );

    addresses = await request.getAddresses(t.context["cookie"]);

    address = {
        address: "QA_" + faker.address.streetAddress(),
        city: city,
        default: true,
        district: district,
        firstName: "QA_" + faker.name.firstName(),
        lastName: "QA_" + faker.name.lastName(),
        phone: faker.phone.phoneNumber().replace(/ /g, ""),
        type: "shipping"
    };
});

test("GET / cannot get non-existing address", async t => {
    const res = await request.get(
        config.api.addresses + "/" + "INVALID-ID",
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 404);
    t.deepEqual(res.body.message, "Address not found.");
    t.snapshot(res.body);
});

test("POST / cannot add address missing type", async t => {
    const clone = Object.assign({}, address);
    delete clone.type;

    const res = await request.post(
        config.api.addresses,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_TYPE_PARAM");
    t.snapshot(res.body);
});

test("POST / cannot add address missing name", async t => {
    const clone = Object.assign({}, address);
    delete clone.firstName;
    delete clone.lastName;

    const res = await request.post(
        config.api.addresses,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("POST / cannot add address missing phone", async t => {
    const clone = Object.assign({}, address);
    delete clone.phone;

    const res = await request.post(
        config.api.addresses,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("POST / cannot add address missing address", async t => {
    const clone = Object.assign({}, address);
    delete clone.address;

    const res = await request.post(
        config.api.addresses,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("POST / cannot add address missing district", async t => {
    const clone = Object.assign({}, address);
    delete clone.district;

    const res = await request.post(
        config.api.addresses,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("POST / cannot add address missing city", async t => {
    const clone = Object.assign({}, address);
    delete clone.city;

    const res = await request.post(
        config.api.addresses,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("POST / cannot add address with length > 70", async t => {
    const clone = Object.assign({}, address);
    clone.address = clone.address.repeat(10);

    const res = await request.post(
        config.api.addresses,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "ADDRESS_TOO_LONG");
    t.snapshot(res.body);
});

test.skip("POST / cannot add address with invalid phone", async t => {
    const clone = Object.assign({}, address);
    clone.phone = faker.random.number().toString();

    const res = await request.post(
        config.api.addresses,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "PHONE_INVALID_FORMAT");
    t.snapshot(res.body);
}); // wait for WWW-354

test.skip("POST / cannot add address with invalid tax code", async t => {
    const clone = Object.assign({}, address);
    clone.taxCode = faker.random.number().toString();
    clone.type = "billing";

    const res = await request.post(
        config.api.addresses,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "TAX_CODE_INVALID_FORMAT");
    t.snapshot(res.body);
}); // wait for WWW-354

test("PUT / cannot update address missing name", async t => {
    const clone = Object.assign({}, address);
    delete clone.firstName;
    delete clone.lastName;

    const res = await request.put(
        config.api.addresses + "/" + addresses.shipping[0].id,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("PUT / cannot update address missing phone", async t => {
    const clone = Object.assign({}, address);
    delete clone.phone;

    const res = await request.put(
        config.api.addresses + "/" + addresses.shipping[0].id,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("PUT / cannot update address missing address", async t => {
    const clone = Object.assign({}, address);
    delete clone.address;

    const res = await request.put(
        config.api.addresses + "/" + addresses.shipping[0].id,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("PUT / cannot update address missing district", async t => {
    const clone = Object.assign({}, address);
    delete clone.district;

    const res = await request.put(
        config.api.addresses + "/" + addresses.shipping[0].id,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("PUT / cannot update address missing city", async t => {
    const clone = Object.assign({}, address);
    delete clone.city;

    const res = await request.put(
        config.api.addresses + "/" + addresses.shipping[0].id,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "MISSING_REQUIRED_PARAMS");
    t.snapshot(res.body);
});

test("PUT / cannot update address with length > 70", async t => {
    const clone = Object.assign({}, address);
    clone.address = clone.address.repeat(10);

    const res = await request.put(
        config.api.addresses + "/" + addresses.shipping[0].id,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "ADDRESS_TOO_LONG");
    t.snapshot(res.body);
});

test("PUT / cannot update address with invalid phone", async t => {
    const clone = Object.assign({}, address);
    clone.phone = faker.random.number().toString();

    const res = await request.put(
        config.api.addresses + "/" + addresses.shipping[0].id,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "PHONE_INVALID_FORMAT");
    t.snapshot(res.body);
});

test("PUT / cannot update address with invalid tax code", async t => {
    const clone = Object.assign({}, address);
    clone.taxCode = faker.random.number().toString();
    clone.type = "billing";

    const res = await request.put(
        config.api.addresses + "/" + addresses.billing[0].id,
        clone,
        t.context["cookie"]
    );

    t.deepEqual(res.statusCode, 400);
    t.deepEqual(res.body.message, "TAX_CODE_INVALID_FORMAT");
    t.snapshot(res.body);
});
