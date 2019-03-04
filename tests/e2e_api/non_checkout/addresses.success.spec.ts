import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let cities: Model.City[]
let districts: Model.District[]
let addresses: Model.Addresses

let request = new Utils.AddressUtils

import test from 'ava'

test.before(async t => {
    t.context['cookie'] = await request.getLogInCookie(config.testAccount.email_ex[9],
        config.testAccount.password_ex)

    cities = await request.getCities()
})

test.after.always(async t => {
    await request.deleteAddresses(t.context['cookie'])
})

test('GET / get all cities', async t => {
    const res = await request.get(config.api.addresses + '/cities')
    cities = res.body

    t.deepEqual(res.statusCode, 200)

    cities.forEach(city => {
        t.truthy(city.id)
        t.truthy(city.name)
    })
})

test('GET / get all districts of each city', async t => {
    for (let city of cities) {
        const res = await request.get(config.api.addresses + '/cities/' + city.id +
            '/districts')

        districts = res.body

        t.deepEqual(res.statusCode, 200)

        districts.forEach(district => {
            t.truthy(district.id)
            t.truthy(district.name)
        })
    }
})

test('GET / get all addresses', async t => {
    const res = await request.get(config.api.addresses, t.context['cookie'])
    addresses = res.body

    t.deepEqual(res.statusCode, 200)
    t.truthy(addresses.billing)
    t.truthy(addresses.shipping)
})

test.serial('POST / add new valid shipping address (not duplicated billing address)', async t => {
    let shipping = await request.generateAddress('shipping', cities)
    shipping.duplicateBilling = false

    const res = await request.post(config.api.addresses, shipping, t.context['cookie'])
    addresses = res.body

    t.deepEqual(res.statusCode, 200)
    t.truthy(addresses.shipping[0].id)
    t.deepEqual(addresses.shipping[0].address, shipping.address)
    t.deepEqual(addresses.shipping[0].city, shipping.city)
    t.true(addresses.shipping[0].default)
    t.deepEqual(addresses.shipping[0].district, shipping.district)
    t.deepEqual(addresses.shipping[0].firstName, shipping.firstName)
    t.deepEqual(addresses.shipping[0].lastName, shipping.lastName)
    t.deepEqual(addresses.shipping[0].phone, shipping.phone)
})

test.serial('POST / add new valid shipping address (duplicated billing address)', async t => {
    let shipping = await request.generateAddress('shipping', cities)
    shipping.duplicateBilling = true

    const res = await request.post(config.api.addresses, shipping, t.context['cookie'])
    addresses = res.body

    t.deepEqual(res.statusCode, 200)

    t.truthy(addresses.shipping[0].id)
    t.deepEqual(addresses.shipping[0].address, shipping.address)
    t.deepEqual(addresses.shipping[0].city, shipping.city)
    t.true(addresses.shipping[0].default)
    t.deepEqual(addresses.shipping[0].district, shipping.district)
    t.deepEqual(addresses.shipping[0].firstName, shipping.firstName)
    t.deepEqual(addresses.shipping[0].lastName, shipping.lastName)
    t.deepEqual(addresses.shipping[0].phone, shipping.phone)

    t.truthy(addresses.billing[0].id)
    t.deepEqual(addresses.billing[0].address, shipping.address)
    t.deepEqual(addresses.billing[0].city, shipping.city)
    t.true(addresses.billing[0].default)
    t.deepEqual(addresses.billing[0].district, shipping.district)
    t.deepEqual(addresses.billing[0].firstName, shipping.firstName)
    t.deepEqual(addresses.billing[0].lastName, shipping.lastName)
    t.deepEqual(addresses.billing[0].phone, shipping.phone)
})

test.serial('POST / add new billing address', async t => {
    let billing = await request.generateAddress('billing', cities)
    const res = await request.post(config.api.addresses, billing, t.context['cookie'])
    addresses = res.body

    t.deepEqual(res.statusCode, 200)
    t.truthy(addresses.billing[0].id)
    t.deepEqual(addresses.billing[0].address, billing.address)
    t.deepEqual(addresses.billing[0].city, billing.city)
    t.true(addresses.billing[0].default)
    t.deepEqual(addresses.billing[0].district, billing.district)
    t.deepEqual(addresses.billing[0].firstName, billing.firstName)
    t.deepEqual(addresses.billing[0].lastName, billing.lastName)
    t.deepEqual(addresses.billing[0].phone, billing.phone)
    t.deepEqual(addresses.billing[0].companyName, billing.companyName)
    t.deepEqual(addresses.billing[0].taxCode, billing.taxCode)
})

test.serial('PUT / update shipping address', async t => {
    addresses = await request.getAddresses(t.context['cookie'])

    let newShipping = await request.generateAddress('shipping', cities)
    newShipping.id = addresses.shipping[0].id

    let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
        newShipping, t.context['cookie'])
    addresses = res.body

    t.deepEqual(res.statusCode, 200)

    res = await request.get(config.api.addresses + '/' + addresses.shipping[0].id, t.context['cookie'])
    let address: Model.Shipping
    address = res.body

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(address.id, newShipping.id)
    t.deepEqual(address.address, newShipping.address)
    t.deepEqual(address.city, newShipping.city)
    t.deepEqual(address.default, newShipping.default)
    t.deepEqual(address.district, newShipping.district)
    t.deepEqual(address.firstName, newShipping.firstName)
    t.deepEqual(address.lastName, newShipping.lastName)
    t.deepEqual(address.phone, newShipping.phone)
})

test.serial('PUT / update billing address', async t => {
    addresses = await request.getAddresses(t.context['cookie'])

    let newBilling = await request.generateAddress('billing', cities)
    newBilling.id = addresses.billing[0].id
    newBilling.taxCode = '0789456321'

    let res = await request.put(config.api.addresses + '/' + addresses.billing[0].id,
        newBilling, t.context['cookie'])
    addresses = res.body

    t.deepEqual(res.statusCode, 200)

    res = await request.get(config.api.addresses + '/' + addresses.billing[0].id, t.context['cookie'])
    let address: Model.Billing
    address = res.body

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(address.id, newBilling.id)
    t.deepEqual(address.address, newBilling.address)
    t.deepEqual(address.city, newBilling.city)
    t.deepEqual(address.default, newBilling.default)
    t.deepEqual(address.district, newBilling.district)
    t.deepEqual(address.firstName, newBilling.firstName)
    t.deepEqual(address.lastName, newBilling.lastName)
    t.deepEqual(address.phone, newBilling.phone)
    t.deepEqual(address.companyName, newBilling.companyName)
    t.deepEqual(address.taxCode, newBilling.taxCode)
})

test.serial('DELETE / delete shipping address', async t => {
    addresses = await request.getAddresses(t.context['cookie'])
    let toDeleteId = addresses.shipping[0].id

    if (addresses.shipping.length > 0) {
        await request.delete(config.api.addresses + '/' + toDeleteId, t.context['cookie'])
    }

    addresses = await request.getAddresses(t.context['cookie'])

    for (let shipping of addresses.shipping) {
        t.notDeepEqual(shipping.id, toDeleteId)
    }
})

test.serial('DELETE / delete billing address', async t => {
    addresses = await request.getAddresses(t.context['cookie'])
    let toDeleteId = addresses.billing[0].id

    if (addresses.billing.length > 0) {
        await request.delete(config.api.addresses + '/' + toDeleteId, t.context['cookie'])
    }

    addresses = await request.getAddresses(t.context['cookie'])

    for (let billing of addresses.billing) {
        t.notDeepEqual(billing.id, toDeleteId)
    }
})

// test('generate fake addressess', async t => {
//     for (let email of config.testAccount.email_ex) {
//         t.context['cookie'] = await request.getLogInt.context['cookie'](email,
//             config.testAccount.password_ex)
//         cities = await request.getCities()
//         let shipping = await request.generateAddress('shipping', cities)
//         shipping.duplicateBilling = true

//         const res = await request.post(config.api.addresses, shipping, t.context['cookie'])
//         addresses = res.body
//         t.log(email, addresses)
//         t.deepEqual(res.statusCode, 200)
//     }
// })