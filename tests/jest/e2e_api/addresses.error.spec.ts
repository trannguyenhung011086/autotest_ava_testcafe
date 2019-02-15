import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import faker from 'faker/locale/vi'
import * as model from '../../../common/interface'

let cookie: string
let city: model.City
let district: model.District
let address: model.Shipping
let addresses: model.Addresses

let request = new Utils.AddressUtils

export const AddressesErrorTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie(config.testAccount.email, config.testAccount.password)
        
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

    it('GET / cannot get non-existing address', async () => {
        let res = await request.get(config.api.addresses + '/' + 'INVALID-ID', cookie)
        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('Address not found.')
    })

    it('POST / cannot add address missing type', async () => {
        let clone = Object.assign({}, address)
        delete clone.type

        let res = await request.post(config.api.addresses, clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_TYPE_PARAM')

        addresses = await request.getAddresses(cookie)
        expect(addresses.shipping[0].address).not.toEqual(clone.address)
        expect(addresses.shipping[0].firstName).not.toEqual(clone.firstName)
        expect(addresses.shipping[0].lastName).not.toEqual(clone.lastName)
        expect(addresses.shipping[0].phone).not.toEqual(clone.phone)
    })

    it('POST / cannot add address missing name', async () => {
        let clone = Object.assign({}, address)
        delete clone.firstName
        delete clone.lastName

        let res = await request.post(config.api.addresses, clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')

        addresses = await request.getAddresses(cookie)
        expect(addresses.shipping[0].address).not.toEqual(clone.address)
        expect(addresses.shipping[0].firstName).not.toEqual(clone.firstName)
        expect(addresses.shipping[0].lastName).not.toEqual(clone.lastName)
        expect(addresses.shipping[0].phone).not.toEqual(clone.phone)
    })

    it('POST / cannot add address missing phone', async () => {
        let clone = Object.assign({}, address)
        delete clone.phone

        let res = await request.post(config.api.addresses, clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')

        addresses = await request.getAddresses(cookie)
        expect(addresses.shipping[0].address).not.toEqual(clone.address)
        expect(addresses.shipping[0].firstName).not.toEqual(clone.firstName)
        expect(addresses.shipping[0].lastName).not.toEqual(clone.lastName)
        expect(addresses.shipping[0].phone).not.toEqual(clone.phone)
    })

    it('POST / cannot add address missing address', async () => {
        let clone = Object.assign({}, address)
        delete clone.address

        let res = await request.post(config.api.addresses, clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')

        addresses = await request.getAddresses(cookie)
        expect(addresses.shipping[0].address).not.toEqual(clone.address)
        expect(addresses.shipping[0].firstName).not.toEqual(clone.firstName)
        expect(addresses.shipping[0].lastName).not.toEqual(clone.lastName)
        expect(addresses.shipping[0].phone).not.toEqual(clone.phone)
    })

    it('POST / cannot add address missing district', async () => {
        let clone = Object.assign({}, address)
        delete clone.district

        let res = await request.post(config.api.addresses, clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')

        addresses = await request.getAddresses(cookie)
        expect(addresses.shipping[0].address).not.toEqual(clone.address)
        expect(addresses.shipping[0].firstName).not.toEqual(clone.firstName)
        expect(addresses.shipping[0].lastName).not.toEqual(clone.lastName)
        expect(addresses.shipping[0].phone).not.toEqual(clone.phone)
    })

    it('POST / cannot add address missing city', async () => {
        let clone = Object.assign({}, address)
        delete clone.city

        let res = await request.post(config.api.addresses, clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')

        addresses = await request.getAddresses(cookie)
        expect(addresses.shipping[0].address).not.toEqual(clone.address)
        expect(addresses.shipping[0].firstName).not.toEqual(clone.firstName)
        expect(addresses.shipping[0].lastName).not.toEqual(clone.lastName)
        expect(addresses.shipping[0].phone).not.toEqual(clone.phone)
    })

    it('POST / cannot add address with length > 70', async () => {
        let clone = Object.assign({}, address)
        clone.address = clone.address.repeat(10)

        let res = await request.post(config.api.addresses, clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('ADDRESS_TOO_LONG')

        addresses = await request.getAddresses(cookie)
        expect(addresses.shipping[0].address).not.toEqual(clone.address)
        expect(addresses.shipping[0].firstName).not.toEqual(clone.firstName)
        expect(addresses.shipping[0].lastName).not.toEqual(clone.lastName)
        expect(addresses.shipping[0].phone).not.toEqual(clone.phone)
    })

    test.skip('POST / cannot add address with invalid phone', async () => {
        let clone = Object.assign({}, address)
        clone.phone = faker.random.number().toString()

        let res = await request.post(config.api.addresses, clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('PHONE_INVALID_FORMAT')

        addresses = await request.getAddresses(cookie)
        expect(addresses.shipping[0].address).not.toEqual(clone.address)
        expect(addresses.shipping[0].firstName).not.toEqual(clone.firstName)
        expect(addresses.shipping[0].lastName).not.toEqual(clone.lastName)
        expect(addresses.shipping[0].phone).not.toEqual(clone.phone)
    }) // wait for WWW-354

    test.skip('POST / cannot add address with invalid tax code', async () => {
        let clone = Object.assign({}, address)
        clone.taxCode = faker.random.number().toString()
        clone.type = 'billing'

        let res = await request.post(config.api.addresses, clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('TAX_CODE_INVALID_FORMAT')

        addresses = await request.getAddresses(cookie)
        expect(addresses.billing[0].address).not.toEqual(clone.address)
        expect(addresses.billing[0].firstName).not.toEqual(clone.firstName)
        expect(addresses.billing[0].lastName).not.toEqual(clone.lastName)
        expect(addresses.billing[0].phone).not.toEqual(clone.phone)
    }) // wait for WWW-354

    it('PUT / cannot update address missing name', async () => {
        let clone = Object.assign({}, address)
        delete clone.firstName
        delete clone.lastName

        let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    it('PUT / cannot update address missing phone', async () => {
        let clone = Object.assign({}, address)
        delete clone.phone

        let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    it('PUT / cannot update address missing address', async () => {
        let clone = Object.assign({}, address)
        delete clone.address

        let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    it('PUT / cannot update address missing district', async () => {
        let clone = Object.assign({}, address)
        delete clone.district

        let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    it('PUT / cannot update address missing city', async () => {
        let clone = Object.assign({}, address)
        delete clone.city

        let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    it('PUT / cannot update address with length > 70', async () => {
        let clone = Object.assign({}, address)
        clone.address = clone.address.repeat(10)

        let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('ADDRESS_TOO_LONG')
    })

    it('PUT / cannot update address with invalid phone', async () => {
        let clone = Object.assign({}, address)
        clone.phone = faker.random.number().toString()

        let res = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('PHONE_INVALID_FORMAT')
    })

    it('PUT / cannot update address with invalid tax code', async () => {
        let clone = Object.assign({}, address)
        clone.taxCode = faker.random.number().toString()
        clone.type = 'billing'

        let res = await request.put(config.api.addresses + '/' + addresses.billing[0].id,
            clone, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('TAX_CODE_INVALID_FORMAT')
    })
}

describe('Addresses error API ' + config.baseUrl + config.api.addresses, AddressesErrorTest)