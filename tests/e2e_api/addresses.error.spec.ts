import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()
import * as faker from 'faker/locale/vi'
import * as model from '../../common/interface'
import { resolvePtr } from 'dns';
let cookie: string
let city: model.City
let district: model.District
let address: model.Shipping
let addresses: model.Addresses

describe('Addresses API ' + config.baseUrl + config.api.addresses, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        addresses = await request.getAddresses(cookie)
        let cities = await request.getCities()
        city = await request.getCity(cities)
        let districts = await request.getDistricts(city.id)
        district = await request.getDistrict(districts)
        address = {
            address: faker.address.streetAddress(),
            city: city,
            default: true,
            district: district,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            phone: faker.phone.phoneNumber().replace(/ /g, ''),
            type: 'shipping'
        }
    })

    test('GET / cannot access address with invalid cookie', async () => {
        let response = await request.get(config.api.addresses + '/' + addresses.shipping[0].id,
            'INVALID-COOKIE')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })

    test('GET / cannot get non-existing address', async () => {
        let response = await request.get(config.api.addresses + '/' + 'INVALID-ID', cookie)
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('Address not found.')
    })

    test('POST / cannot add address missing type', async () => {
        let clone = Object.assign({}, address)
        delete clone.type
        let response = await request.post(config.api.addresses, clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_TYPE_PARAM')
    })

    test('POST / cannot add address missing name', async () => {
        let clone = Object.assign({}, address)
        delete clone.firstName
        delete clone.lastName
        let response = await request.post(config.api.addresses, clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('POST / cannot add address missing phone', async () => {
        let clone = Object.assign({}, address)
        delete clone.phone
        let response = await request.post(config.api.addresses, clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('POST / cannot add address missing address', async () => {
        let clone = Object.assign({}, address)
        delete clone.address
        let response = await request.post(config.api.addresses, clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('POST / cannot add address missing district', async () => {
        let clone = Object.assign({}, address)
        delete clone.district
        let response = await request.post(config.api.addresses, clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('POST / cannot add address missing city', async () => {
        let clone = Object.assign({}, address)
        delete clone.city
        let response = await request.post(config.api.addresses, clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('POST / cannot add address with length > 70', async () => {
        let clone = Object.assign({}, address)
        clone.address = clone.address.repeat(10)
        let response = await request.post(config.api.addresses, clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('ADDRESS_TOO_LONG')
    })

    test('POST / cannot add address with invalid phone', async () => {
        let clone = Object.assign({}, address)
        clone.phone = faker.random.number().toString()
        let response = await request.post(config.api.addresses, clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('PHONE_INVALID_FORMAT')
    })

    test('POST / cannot add address with invalid tax code', async () => {
        let clone = Object.assign({}, address)
        clone.taxCode = faker.random.number().toString()
        clone.type = 'billing'
        let response = await request.post(config.api.addresses, clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('TAX_CODE_INVALID_FORMAT')
    })

    test('PUT / cannot update address missing name', async () => {
        let clone = Object.assign({}, address)
        delete clone.firstName
        delete clone.lastName
        let response = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('PUT / cannot update address missing phone', async () => {
        let clone = Object.assign({}, address)
        delete clone.phone
        let response = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('PUT / cannot update address missing address', async () => {
        let clone = Object.assign({}, address)
        delete clone.address
        let response = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('PUT / cannot update address missing district', async () => {
        let clone = Object.assign({}, address)
        delete clone.district
        let response = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('PUT / cannot update address missing city', async () => {
        let clone = Object.assign({}, address)
        delete clone.city
        let response = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('MISSING_REQUIRED_PARAMS')
    })

    test('PUT / cannot update address with length > 70', async () => {
        let clone = Object.assign({}, address)
        clone.address = clone.address.repeat(10)
        let response = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('ADDRESS_TOO_LONG')
    })

    test('PUT / cannot update address with invalid phone', async () => {
        let clone = Object.assign({}, address)
        clone.phone = faker.random.number().toString()
        let response = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('PHONE_INVALID_FORMAT')
    })

    test('PUT / cannot update address with invalid tax code', async () => {
        let clone = Object.assign({}, address)
        clone.taxCode = faker.random.number().toString()
        clone.type = 'billing'
        let response = await request.put(config.api.addresses + '/' + addresses.shipping[0].id,
            clone, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('TAX_CODE_INVALID_FORMAT')
    })
})