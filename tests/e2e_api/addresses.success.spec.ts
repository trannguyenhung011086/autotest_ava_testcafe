import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../common/interface'
let cookie: string
let cities: model.City[]
let addresses: model.Addresses
import waitForExpect from 'wait-for-expect'

describe('Addresses API ' + config.baseUrl + config.api.addresses, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        cities = await request.getCities()
        await request.deleteAddresses()
    })

    test('GET / get all cities', async () => {
        let response = await request.get(config.api.addresses + '/cities')
        let cities: model.City[]
        cities = response.data
        expect(response.status).toEqual(200)

        for (let city of cities) {
            expect(city.id).not.toBeEmpty()
            expect(city.name).not.toBeEmpty()
        }
    })

    test('GET / get all districts of each city', async () => {
        for (let city of cities) {
            let response = await request.get(config.api.addresses + '/cities/' + city.id +
                '/districts')
            let districts: model.District[]
            districts = response.data
            expect(response.status).toEqual(200)

            for (let district of districts) {
                expect(district.id).not.toBeEmpty()
                expect(district.name).not.toBeEmpty()
            }
        }
    })

    test('GET / get all addresses', async () => {
        let response = await request.get(config.api.addresses)
        addresses = response.data
        expect(response.status).toEqual(200)
        expect(addresses.billing).toBeArray()
        expect(addresses.shipping).toBeArray()
    })

    test('POST / add new valid shipping address (not duplicated billing address)', async () => {
        let shipping = await request.generateAddress('shipping', cities)
        shipping.duplicateBilling = false

        let response = await request.post(config.api.addresses, shipping)
        addresses = response.data
        await waitForExpect(() => {
            expect(response.status).toEqual(200)
            expect(addresses.shipping[0].id).not.toBeEmpty()
            expect(addresses.shipping[0].address).toEqual(shipping.address)
            expect(addresses.shipping[0].city).toEqual(shipping.city)
            expect(addresses.shipping[0].default).toBeTrue()
            expect(addresses.shipping[0].district).toEqual(shipping.district)
            expect(addresses.shipping[0].firstName).toEqual(shipping.firstName)
            expect(addresses.shipping[0].lastName).toEqual(shipping.lastName)
            expect(addresses.shipping[0].phone).toEqual(shipping.phone)
        })
    })

    test('POST / add new valid shipping address (duplicated billing address)', async () => {
        let shipping = await request.generateAddress('shipping', cities)
        shipping.duplicateBilling = true

        let response = await request.post(config.api.addresses, shipping)
        addresses = response.data

        await waitForExpect(() => {
            expect(response.status).toEqual(200)

            expect(addresses.shipping[0].id).not.toBeEmpty()
            expect(addresses.shipping[0].address).toEqual(shipping.address)
            expect(addresses.shipping[0].city).toEqual(shipping.city)
            expect(addresses.shipping[0].default).toBeTrue()
            expect(addresses.shipping[0].district).toEqual(shipping.district)
            expect(addresses.shipping[0].firstName).toEqual(shipping.firstName)
            expect(addresses.shipping[0].lastName).toEqual(shipping.lastName)
            expect(addresses.shipping[0].phone).toEqual(shipping.phone)

            expect(addresses.billing[0].id).not.toBeEmpty()
            expect(addresses.billing[0].address).toEqual(shipping.address)
            expect(addresses.billing[0].city).toEqual(shipping.city)
            expect(addresses.billing[0].default).toBeTrue()
            expect(addresses.billing[0].district).toEqual(shipping.district)
            expect(addresses.billing[0].firstName).toEqual(shipping.firstName)
            expect(addresses.billing[0].lastName).toEqual(shipping.lastName)
            expect(addresses.billing[0].phone).toEqual(shipping.phone)
        })
    })

    test('POST / add new billing address', async () => {
        let billing = await request.generateAddress('billing', cities)
        let response = await request.post(config.api.addresses, billing)
        addresses = response.data

        await waitForExpect(() => {
            expect(response.status).toEqual(200)
            expect(addresses.billing[0].id).not.toBeEmpty()
            expect(addresses.billing[0].address).toEqual(billing.address)
            expect(addresses.billing[0].city).toEqual(billing.city)
            expect(addresses.billing[0].default).toBeTrue()
            expect(addresses.billing[0].district).toEqual(billing.district)
            expect(addresses.billing[0].firstName).toEqual(billing.firstName)
            expect(addresses.billing[0].lastName).toEqual(billing.lastName)
            expect(addresses.billing[0].phone).toEqual(billing.phone)
            expect(addresses.billing[0].companyName).toEqual(billing.companyName)
            expect(addresses.billing[0].taxCode).toEqual(billing.taxCode)
        })
    })

    test('PUT / update shipping address', async () => {
        addresses = await request.getAddresses()

        let newShipping = await request.generateAddress('shipping', cities)
        newShipping.id = addresses.shipping[0].id

        let response = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            newShipping)
        addresses = response.data

        await waitForExpect(() => {
            expect(response.status).toEqual(200)
        })

        response = await request.get(config.api.addresses + '/' + addresses.shipping[0].id)
        let address: model.Shipping
        address = response.data
        expect(response.status).toEqual(200)
        expect(address.id).toEqual(newShipping.id)
        expect(address.address).toEqual(newShipping.address)
        expect(address.city).toEqual(newShipping.city)
        expect(address.default).toEqual(newShipping.default)
        expect(address.district).toEqual(newShipping.district)
        expect(address.firstName).toEqual(newShipping.firstName)
        expect(address.lastName).toEqual(newShipping.lastName)
        expect(address.phone).toEqual(newShipping.phone)
    })

    test('PUT / update billing address', async () => {
        addresses = await request.getAddresses()

        let newBilling = await request.generateAddress('billing', cities)
        newBilling.id = addresses.billing[0].id
        newBilling.taxCode = '0789456321'

        let response = await request.put(config.api.addresses + '/' + addresses.billing[0].id,
            newBilling)
        addresses = response.data

        await waitForExpect(() => {
            expect(response.status).toEqual(200)
        })

        response = await request.get(config.api.addresses + '/' + addresses.billing[0].id)
        let address: model.Billing
        address = response.data
        expect(response.status).toEqual(200)
        expect(address.id).toEqual(newBilling.id)
        expect(address.address).toEqual(newBilling.address)
        expect(address.city).toEqual(newBilling.city)
        expect(address.default).toEqual(newBilling.default)
        expect(address.district).toEqual(newBilling.district)
        expect(address.firstName).toEqual(newBilling.firstName)
        expect(address.lastName).toEqual(newBilling.lastName)
        expect(address.phone).toEqual(newBilling.phone)
        expect(address.companyName).toEqual(newBilling.companyName)
        expect(address.taxCode).toEqual(newBilling.taxCode)
    })

    test('DELETE / delete shipping address', async () => {
        addresses = await request.getAddresses()
        let toDeleteId = addresses.shipping[0].id
        if (addresses.shipping.length > 0) {
            await request.delete(config.api.addresses + '/' + toDeleteId)
        }

        addresses = await request.getAddresses()
        for (let shipping of addresses.shipping) {
            await waitForExpect(() => {
                expect(shipping.id).not.toEqual(toDeleteId)
            })
        }
    })

    test('DELETE / delete billing address', async () => {
        addresses = await request.getAddresses()
        let toDeleteId = addresses.billing[0].id
        if (addresses.billing.length > 0) {
            await request.delete(config.api.addresses + '/' + toDeleteId)
        }

        addresses = await request.getAddresses()
        for (let billing of addresses.billing) {
            await waitForExpect(() => {
                expect(billing.id).not.toEqual(toDeleteId)
            })
        }
    })
})