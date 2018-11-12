import config from '../config/config'
import axios, { AxiosRequestConfig } from 'axios'

export class Utils {
    public settings: AxiosRequestConfig = {
        baseURL: config.baseUrl,
        withCredentials: true,
        headers: {
            'Content-type': 'application/json'
        },
        validateStatus: (status) => {
            return true
        }
    }

    public async getLogInCookie() {
        const settings = this.settings
        const data: Object = {
            email: config.testAccount.email,
            password: config.testAccount.password
        }
        var cookie: string = await axios.post(config.api.login, data, settings)
            .then(response => response.headers['set-cookie'][0])
        return cookie
    }

    public async post(api: string, data: Object, cookie: string = null) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.post(api, data, settings)
    }

    public async put(api: string, data: Object, cookie: string = null) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.put(api, data, settings)
    }

    public async get(api: string, cookie: string = null) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.get(api, settings)
    }

    public async getSales(saleType: string) {
        const r = await this.get(saleType)
        return r.data
    }

    public async getSaleInfo(saleId: string) {
        const r = await this.get(config.api.sales + saleId)
        if (r.status != 200) {
            throw r.data
        }
        return r.data
    }

    public async getProductInfo(productId: string) {
        const r = await this.get(config.api.product + productId)
        return r.data
    }

    public async getProducts(saleType: string, productType?: string) {
        const sales = await this.getSales(saleType)
        let domestic = []
        let international = []

        sales.forEach(sale => {
            if (sale['international'] == false) {
                domestic.push(sale)
            } else if (sale['international'] == true) {
                international.push(sale)
            }
        })

        if (productType == 'international' || saleType == config.api.internationalSales) {
            const saleInfo = await this.getSaleInfo(international[0]['id'])
            return saleInfo['products']
        } else {
            const saleInfo = await this.getSaleInfo(domestic[0]['id'])
            return saleInfo['products']
        }
    }

    public async getSaleWithManyProducts(saleType: string, amount: number = 90) {
        const sales = await this.getSales(saleType)
        for (let sale of sales) {
            var saleInfo = await this.getSaleInfo(sale['id'])
            var products: any[] = saleInfo['products']
            if (products.length > amount) {
                return sale
            }
        }
    }
}