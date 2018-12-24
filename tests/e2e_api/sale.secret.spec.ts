import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as model from '../../common/interface'

describe('Secret sale API ' + config.baseUrl + config.api.secretSale, () => {
    test('GET / cannot get secret sale when not call campaign API', async () => {
        let response = await request.get(config.api.secretSale)
        expect(response.status).toEqual(200)
        expect(response.data).toBeArrayOfSize(0)
    })

    test('GET / check secret sale when not call campaign API', async () => {
        let response = await request.get(config.api.secretSale + '/check')
        expect(response.status).toEqual(200)
        expect(response.data).toBeFalse()
    })

    test('GET / get secret sale when call campaign API', async () => {
        let campaign: model.Campaign = await access.getCampaign({
            endDate: { $gt: new Date() }
        })
        await request.get(config.api.campaign + campaign.name)

        let response = await request.get(config.api.secretSale)
        expect(response.status).toEqual(200)
        expect(response.data).toBeArrayOfSize(1)

        let sale: model.SalesModel = response.data[0]
        expect(sale.title).not.toBeEmpty()
        expect(sale.endTime).not.toBeEmpty()
        expect(sale.potd).toBeBoolean()
        expect(sale.slug).toInclude(sale.id)
        expect(sale.categories).toBeArray()

        let saleInfo = await request.getSaleInfo(sale.id)
        expect(saleInfo.campaign).toBeTrue()
    })

    test('GET / check secret sale when call campaign API', async () => {
        let campaign: model.Campaign = await access.getCampaign({
            endDate: { $gt: new Date() }
        })
        await request.get(config.api.campaign + campaign.name)

        let response = await request.get(config.api.secretSale + '/check')
        expect(response.status).toEqual(200)
        expect(response.data).toBeTrue()
    })
})