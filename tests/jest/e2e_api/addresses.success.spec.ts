import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'
import waitForExpect from 'wait-for-expect'

let cookie: string
let cities: model.City[]
let addresses: model.Addresses

let request = new Utils.AddressUtils

export const AddressesSuccessTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie(config.testAccount.email, config.testAccount.password)
        cities = await request.getCities()
        jest.setTimeout(120000)
    })

    afterAll(async () => {
        await request.deleteAddresses(cookie)
    })

    it('GET / get all cities', async () => {
        let res = await request.get(config.api.addresses + '/cities')
        let cities: model.City[]

        cities = res.body
        expect(res.statusCode).toEqual(200)

        cities.forEach(city => {
            expect(city.id).not.toBeEmpty()
            expect(city.name).not.toBeEmpty()
        })
    })

    it('GET / get all districts of each city', async () => {
        for (let city of cities) {
            let res = await request.get(config.api.addresses + '/cities/' + city.id +
                '/districts')
            let districts: model.District[]

            districts = res.body
            expect(res.statusCode).toEqual(200)

            districts.forEach(district => {
                expect(district.id).not.toBeEmpty()
                expect(district.name).not.toBeEmpty()
            })
        }
    })

    it('GET / get all addresses', async () => {
        let res = await request.get(config.api.addresses, cookie)
        addresses = res.body

        expect(res.statusCode).toEqual(200)
        expect(addresses.billing).toBeArray()
        expect(addresses.shipping).toBeArray()
    })

    it('POST / add new valid shipping address (not duplicated billing address)', async () => {
        let shipping = await request.generateAddress('shipping', cities)
        shipping.duplicateBilling = false

        let res = await request.post(config.api.addresses, shipping, cookie)
        addresses = res.body

        await waitForExpect(() => {
            expect(res.statusCode).toEqual(200)
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

    it('POST / add new valid shipping address (duplicated billing address)', async () => {
        let shipping = await request.generateAddress('shipping', cities)
        shipping.duplicateBilling = true

        let res = await request.post(config.api.addresses, shipping, cookie)
        addresses = res.body

        await waitForExpect(() => {
            expect(res.statusCode).toEqual(200)

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

    it('POST / add new billing address', async () => {
        let billing = await request.generateAddress('billing', cities)
        let res = await request.post(config.api.addresses, billing, cookie)
        addresses = res.body

        await waitForExpect(() => {
            expect(res.statusCode).toEqual(200)
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

    it('PUT / update shipping address', async () => {
        addresses = await request.getAddresses(cookie)

        let newShipping = await request.generateAddress('shipping', cities)
        newShipping.id = addresses.shipping[0].id

        let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            newShipping, cookie)
        addresses = res.body

        await waitForExpect(() => {
            expect(res.statusCode).toEqual(200)
        })

        res = await request.get(config.api.addresses + '/' + addresses.shipping[0].id, cookie)
        let address: model.Shipping
        address = res.body

        expect(res.statusCode).toEqual(200)
        expect(address.id).toEqual(newShipping.id)
        expect(address.address).toEqual(newShipping.address)
        expect(address.city).toEqual(newShipping.city)
        expect(address.default).toEqual(newShipping.default)
        expect(address.district).toEqual(newShipping.district)
        expect(address.firstName).toEqual(newShipping.firstName)
        expect(address.lastName).toEqual(newShipping.lastName)
        expect(address.phone).toEqual(newShipping.phone)
    })

    it('PUT / update billing address', async () => {
        addresses = await request.getAddresses(cookie)

        let newBilling = await request.generateAddress('billing', cities)
        newBilling.id = addresses.billing[0].id
        newBilling.taxCode = '0789456321'

        let res = await request.put(config.api.addresses + '/' + addresses.billing[0].id,
            newBilling, cookie)
        addresses = res.body

        await waitForExpect(() => {
            expect(res.statusCode).toEqual(200)
        })

        res = await request.get(config.api.addresses + '/' + addresses.billing[0].id, cookie)
        let address: model.Billing
        address = res.body

        expect(res.statusCode).toEqual(200)
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

    it('DELETE / delete shipping address', async () => {
        addresses = await request.getAddresses(cookie)
        let toDeleteId = addresses.shipping[0].id

        if (addresses.shipping.length > 0) {
            await request.delete(config.api.addresses + '/' + toDeleteId, cookie)
        }

        addresses = await request.getAddresses(cookie)

        for (let shipping of addresses.shipping) {
            await waitForExpect(() => {
                expect(shipping.id).not.toEqual(toDeleteId)
            })
        }
    })

    it('DELETE / delete billing address', async () => {
        addresses = await request.getAddresses(cookie)
        let toDeleteId = addresses.billing[0].id

        if (addresses.billing.length > 0) {
            await request.delete(config.api.addresses + '/' + toDeleteId, cookie)
        }

        addresses = await request.getAddresses(cookie)

        for (let billing of addresses.billing) {
            await waitForExpect(() => {
                expect(billing.id).not.toEqual(toDeleteId)
            })
        }
    })
}

describe('Addresses success API ' + config.baseUrl + config.api.addresses, AddressesSuccessTest)