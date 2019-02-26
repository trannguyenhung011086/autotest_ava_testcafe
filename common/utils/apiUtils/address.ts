import { config } from '../../config'
import * as Model from '../../interface'
import { Helper } from '../helper'
import * as faker from 'faker/locale/vi'

export class AddressUtils extends Helper {
    constructor() {
        super()
    }

    public async getAddresses(cookie?: string): Promise<Model.Addresses> {
        try {
            let res = await this.get(config.api.addresses, cookie)
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get address list!',
                error: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async getCities(): Promise<Model.City[]> {
        try {
            let res = await this.get(config.api.addresses + '/cities')
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get city list!',
                error: JSON.stringify(e, null, '\t')
            }
        }

    }

    public async getDistricts(cityId: string): Promise<Model.District[]> {
        try {
            let res = await this.get(config.api.addresses + '/cities/' + cityId + '/districts')
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get district list!',
                ererror: JSON.stringify(e, null, '\t')
            }
        }
    }

    public getCity(cities: Model.City[]): Model.City {
        if (!cities) {
            throw 'City list has error!'
        }
        return new Helper().getArrayRandomElement(cities)
    }

    public getDistrict(districts: Model.District[]): Model.District {
        if (!districts) {
            throw 'City list has error!'
        }
        return new Helper().getArrayRandomElement(districts)
    }

    public async deleteAddresses(cookie?: string): Promise<void> {
        let addresses = await this.getAddresses(cookie)
        try {
            if (addresses.billing.length > 0) {
                for (let billing of addresses.billing) {
                    await this.delete(config.api.addresses + '/' + billing.id, cookie)
                }
            }
            if (addresses.shipping.length > 0) {
                for (let shipping of addresses.shipping) {
                    await this.delete(config.api.addresses + '/' + shipping.id, cookie)
                }
            }
        } catch (e) {
            throw {
                message: 'Cannot delete address!',
                ererror: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async addAddresses(cookie?: string) {
        let cities = await this.getCities()
        let shipping = await this.generateAddress('shipping', cities)
        shipping.duplicateBilling = true
        let res = await this.post(config.api.addresses, shipping, cookie)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot add address!',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
    }

    public async generateAddress(addressType: string, cities: Model.City[]) {
        let city = await this.getCity(cities)
        let districts = await this.getDistricts(city.id)
        let district = await this.getDistrict(districts)
        let address: Model.Shipping = {
            address: 'QA_' + faker.address.streetAddress(),
            city: city,
            default: true,
            district: district,
            firstName: 'QA_' + faker.name.firstName(),
            lastName: 'QA_' + faker.name.lastName(),
            phone: faker.phone.phoneNumber().replace(/ /g, '')
        }
        
        if (addressType == 'shipping') {
            address.type = 'shipping'
        }
        if (addressType == 'billing') {
            address.type = 'billing'
            address.companyName = 'QA_' + faker.company.companyName()
            address.taxCode = '1234567890'
        }
        return address
    }
}