import { config } from '../../../config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'

let cookie: string

let request = new Utils.SaleUtils
let access = new Utils.DbAccessUtils

export const SecretSaleTest = () => {
    beforeAll(async () => {
        cookie = await request.getGuestCookie()
    })

    it('GET / cannot get secret sale when not call campaign API', async () => {
        let res = await request.get(config.api.secretSales, cookie)
        expect(res.statusCode).toEqual(200)
        expect(res.body).toBeArrayOfSize(0)
    })

    it('GET / check secret sale when not call campaign API', async () => {
        let res = await request.get(config.api.secretSales + '/check', cookie)
        expect(res.statusCode).toEqual(200)
        expect(res.body).toBeFalse()
    })

    it('GET / get secret sale when call campaign API', async () => {
        let campaign: model.Campaign = await access.getCampaign({
            endDate: { $gt: new Date() }
        })
        await request.get(config.api.campaigns + campaign.name, cookie)

        let res = await request.get(config.api.secretSales, cookie)
        expect(res.statusCode).toEqual(200)

        let sales: model.SalesModel[] = res.body
        expect(sales.length).toBeGreaterThan(0)

        for (let sale of sales) {
            try {
                expect(sale.title).not.toBeEmpty()
                expect(sale.endTime).not.toBeEmpty()
                expect(sale.potd).toBeBoolean()
                expect(sale.slug).toInclude(sale.id)
                expect(sale.categories).toBeArray()

                let saleInfo = await request.getSaleInfo(sale.id)
                expect(saleInfo.campaign).toBeTrue()
            } catch (error) {
                throw { failed_sale: sale, error: error }
            }
        }
    })

    it('GET / check secret sale when call campaign API', async () => {
        let campaign: model.Campaign = await access.getCampaign({
            endDate: { $gt: new Date() }
        })
        await request.get(config.api.campaigns + campaign.name, cookie)

        let res = await request.get(config.api.secretSales + '/check', cookie)
        expect(res.statusCode).toEqual(200)
        expect(res.body).toBeTrue()
    })
}

describe('Secret sale API ' + config.baseUrl + config.api.secretSales, SecretSaleTest)