import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import faker from 'faker/locale/vi'
import * as Model from '../../common/interface'

let cookie: string
let city: Model.City
let district: Model.District
let address: Model.Shipping
let addresses: Model.Addresses

let request = new Utils.AddressUtils

import test from 'ava'

test.before(async t => {
    cookie = await request.getLogInCookie(config.testAccount.email_ex_1,
        config.testAccount.password_ex_1)

    await request.addAddresses(cookie)
    addresses = await request.getAddresses(cookie)

    let cities = await request.getCities()
    city = await request.getCity(cities)
    let districts = await request.getDistricts(city.id)
    district = await request.getDistrict(districts)

    address = {
        address: 'QA_' + faker.address.streetAddress(),
        city: city,
        default: true,
        district: district,
        firstName: 'QA_' + faker.name.firstName(),
        lastName: 'QA_' + faker.name.lastName(),
        phone: faker.phone.phoneNumber().replace(/ /g, ''),
        type: 'shipping'
    }
})

test('GET / cannot get non-existing address', async t => {
    let res = await request.get(config.api.addresses + '/' + 'INVALID-ID', cookie)

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'Address not found.')
})

test('POST / cannot add address missing type', async t => {
    let clone = Object.assign({}, address)
    delete clone.type

    let res = await request.post(config.api.addresses, clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_TYPE_PARAM')

    addresses = await request.getAddresses(cookie)

    t.notDeepEqual(addresses.shipping[0].address, clone.address)
    t.notDeepEqual(addresses.shipping[0].firstName, clone.firstName)
    t.notDeepEqual(addresses.shipping[0].lastName, clone.lastName)
    t.notDeepEqual(addresses.shipping[0].phone, clone.phone)
})

test('POST / cannot add address missing name', async t => {
    let clone = Object.assign({}, address)
    delete clone.firstName
    delete clone.lastName

    let res = await request.post(config.api.addresses, clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')

    addresses = await request.getAddresses(cookie)

    t.notDeepEqual(addresses.shipping[0].address, clone.address)
    t.notDeepEqual(addresses.shipping[0].firstName, clone.firstName)
    t.notDeepEqual(addresses.shipping[0].lastName, clone.lastName)
    t.notDeepEqual(addresses.shipping[0].phone, clone.phone)
})

test('POST / cannot add address missing phone', async t => {
    let clone = Object.assign({}, address)
    delete clone.phone

    let res = await request.post(config.api.addresses, clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')

    addresses = await request.getAddresses(cookie)

    t.notDeepEqual(addresses.shipping[0].address, clone.address)
    t.notDeepEqual(addresses.shipping[0].firstName, clone.firstName)
    t.notDeepEqual(addresses.shipping[0].lastName, clone.lastName)
    t.notDeepEqual(addresses.shipping[0].phone, clone.phone)
})

test('POST / cannot add address missing address', async t => {
    let clone = Object.assign({}, address)
    delete clone.address

    let res = await request.post(config.api.addresses, clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')

    addresses = await request.getAddresses(cookie)

    t.notDeepEqual(addresses.shipping[0].address, clone.address)
    t.notDeepEqual(addresses.shipping[0].firstName, clone.firstName)
    t.notDeepEqual(addresses.shipping[0].lastName, clone.lastName)
    t.notDeepEqual(addresses.shipping[0].phone, clone.phone)
})

test('POST / cannot add address missing district', async t => {
    let clone = Object.assign({}, address)
    delete clone.district

    let res = await request.post(config.api.addresses, clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')

    addresses = await request.getAddresses(cookie)

    t.notDeepEqual(addresses.shipping[0].address, clone.address)
    t.notDeepEqual(addresses.shipping[0].firstName, clone.firstName)
    t.notDeepEqual(addresses.shipping[0].lastName, clone.lastName)
    t.notDeepEqual(addresses.shipping[0].phone, clone.phone)
})

test('POST / cannot add address missing city', async t => {
    let clone = Object.assign({}, address)
    delete clone.city

    let res = await request.post(config.api.addresses, clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')

    addresses = await request.getAddresses(cookie)

    t.notDeepEqual(addresses.shipping[0].address, clone.address)
    t.notDeepEqual(addresses.shipping[0].firstName, clone.firstName)
    t.notDeepEqual(addresses.shipping[0].lastName, clone.lastName)
    t.notDeepEqual(addresses.shipping[0].phone, clone.phone)
})

test('POST / cannot add address with length > 70', async t => {
    let clone = Object.assign({}, address)
    clone.address = clone.address.repeat(10)

    let res = await request.post(config.api.addresses, clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'ADDRESS_TOO_LONG')

    addresses = await request.getAddresses(cookie)

    t.notDeepEqual(addresses.shipping[0].address, clone.address)
    t.notDeepEqual(addresses.shipping[0].firstName, clone.firstName)
    t.notDeepEqual(addresses.shipping[0].lastName, clone.lastName)
    t.notDeepEqual(addresses.shipping[0].phone, clone.phone)
})

test.skip('POST / cannot add address with invalid phone', async t => {
    let clone = Object.assign({}, address)
    clone.phone = faker.random.number().toString()

    let res = await request.post(config.api.addresses, clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'PHONE_INVALID_FORMAT')

    addresses = await request.getAddresses(cookie)

    t.notDeepEqual(addresses.shipping[0].address, clone.address)
    t.notDeepEqual(addresses.shipping[0].firstName, clone.firstName)
    t.notDeepEqual(addresses.shipping[0].lastName, clone.lastName)
    t.notDeepEqual(addresses.shipping[0].phone, clone.phone)
}) // wait for WWW-354

test.skip('POST / cannot add address with invalid tax code', async t => {
    let clone = Object.assign({}, address)
    clone.taxCode = faker.random.number().toString()
    clone.type = 'billing'

    let res = await request.post(config.api.addresses, clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'TAX_CODE_INVALID_FORMAT')

    addresses = await request.getAddresses(cookie)

    t.notDeepEqual(addresses.billing[0].address, clone.address)
    t.notDeepEqual(addresses.billing[0].firstName, clone.firstName)
    t.notDeepEqual(addresses.billing[0].lastName, clone.lastName)
    t.notDeepEqual(addresses.billing[0].phone, clone.phone)
}) // wait for WWW-354

test('PUT / cannot update address missing name', async t => {
    let clone = Object.assign({}, address)
    delete clone.firstName
    delete clone.lastName

    let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
        clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')
})

test('PUT / cannot update address missing phone', async t => {
    let clone = Object.assign({}, address)
    delete clone.phone

    let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
        clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')
})

test('PUT / cannot update address missing address', async t => {
    let clone = Object.assign({}, address)
    delete clone.address

    let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
        clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')
})

test('PUT / cannot update address missing district', async t => {
    let clone = Object.assign({}, address)
    delete clone.district

    let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
        clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')
})

test('PUT / cannot update address missing city', async t => {
    let clone = Object.assign({}, address)
    delete clone.city

    let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
        clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'MISSING_REQUIRED_PARAMS')
})

test('PUT / cannot update address with length > 70', async t => {
    let clone = Object.assign({}, address)
    clone.address = clone.address.repeat(10)

    let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
        clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'ADDRESS_TOO_LONG')
})

test('PUT / cannot update address with invalid phone', async t => {
    let clone = Object.assign({}, address)
    clone.phone = faker.random.number().toString()

    let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
        clone, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'PHONE_INVALID_FORMAT')
})

test('PUT / cannot update address with invalid tax code', async t => {
    let clone = Object.assign({}, address)
    clone.taxCode = faker.random.number().toString()
    clone.type = 'billing'

    let res = await request.put(config.api.addresses + '/' + addresses.billing[0].id,
        clone, cookie)
        
    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'TAX_CODE_INVALID_FORMAT')
})