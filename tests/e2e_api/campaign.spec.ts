import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as model from '../../common/interface'

describe('Campaign API ' + config.baseUrl + config.api.campaign + '<campaignName>', () => {
    
    test('GET / valid campaign name', async () => {
        let campaign: model.Campaign = await access.getCampaign({
            endDate: { $gt: new Date() }
        })

        let response = await request.get(config.api.campaign + campaign.name)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('SET')

        response = await request.get(config.api.campaign + campaign.name)
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('NO_CHANGE')
    })

    test('GET / invalid campaign name', async () => {
        let response = await request.get(config.api.campaign + 'INVALID-CAMPAIGN')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('NOT_FOUND')
    })

    test('GET / missing campaign name', async () => {
        let response = await request.get(config.api.campaign)
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('Not found')
    })
})