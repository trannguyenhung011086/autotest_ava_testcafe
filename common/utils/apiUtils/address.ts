import { config } from "../../config";
import * as Model from "../../interface";
import { Helper } from "../helper";
import * as faker from "faker/locale/vi";

export class AddressUtils extends Helper {
    constructor() {
        super();
    }

    public async getAddresses(cookie?: string): Promise<Model.Addresses> {
        const res = await this.get(config.api.addresses, cookie);
        return res.body;
    }

    public async getCities(): Promise<Model.City[]> {
        const res = await this.get(config.api.addresses + "/cities");
        return res.body;
    }

    public async getDistricts(cityId: string): Promise<Model.District[]> {
        const res = await this.get(
            config.api.addresses + "/cities/" + cityId + "/districts"
        );
        return res.body;
    }

    public getCity(cities: Model.City[]): Model.City {
        if (!cities) {
            throw "City list has error!";
        }
        return new Helper().getArrayRandomElement(cities);
    }

    public getDistrict(districts: Model.District[]): Model.District {
        if (!districts) {
            throw "District list has error!";
        }
        return new Helper().getArrayRandomElement(districts);
    }

    public async deleteAddresses(cookie?: string): Promise<void> {
        const addresses = await this.getAddresses(cookie);
        try {
            for (const billing of addresses.billing) {
                if (addresses.billing.length == 1) {
                    break;
                }
                await this.delete(
                    config.api.addresses + "/" + billing.id,
                    cookie
                );
            }
            for (const shipping of addresses.shipping) {
                if (addresses.shipping.length == 1) {
                    break;
                }
                await this.delete(
                    config.api.addresses + "/" + shipping.id,
                    cookie
                );
            }
        } catch (e) {
            throw {
                message: "Cannot delete address!",
                error: JSON.stringify(e, null, "\t")
            };
        }
    }

    public async addAddresses(cookie?: string) {
        const cities = await this.getCities();
        const shipping = await this.generateAddress("shipping", cities);

        shipping.duplicateBilling = true;
        const res = await this.post(config.api.addresses, shipping, cookie);

        if (res.statusCode != 200) {
            throw {
                message: "Cannot add address!",
                error: JSON.stringify(res.body, null, "\t")
            };
        }
    }

    public async generateAddress(addressType: string, cities: Model.City[]) {
        const city = await this.getCity(cities);
        const districts = await this.getDistricts(city.id);
        const district = await this.getDistrict(districts);
        const address: Model.Shipping = {
            address: "QA_" + faker.address.streetAddress(),
            city: city,
            default: true,
            district: district,
            firstName: "QA_" + faker.name.firstName(),
            lastName: "QA_" + faker.name.lastName(),
            phone: faker.phone.phoneNumber().replace(/ /g, "")
        };

        if (addressType == "shipping") {
            address.type = "shipping";
        }
        if (addressType == "billing") {
            address.type = "billing";
            address.companyName = "QA_" + faker.company.companyName();
            address.taxCode = "1234567890";
        }
        return address;
    }
}
