import { config } from '../../../config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'

let request = new Utils.Helper
let access = new Utils.DbAccessUtils

export const CampaignInfoTest = () => {
    it('GET / valid campaign name', async () => {
        let campaign: model.Campaign = await access.getCampaign({
            endDate: { $gt: new Date() }
        })

        let res = await request.get(config.api.campaigns + campaign.name)
        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('SET')

        res = await request.get(config.api.campaigns + campaign.name)
        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('NO_CHANGE')
    })

    it('GET / invalid campaign name', async () => {
        let res = await request.get(config.api.campaigns + 'INVALID-CAMPAIGN')
        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('NOT_FOUND')
    })

    it('GET / missing campaign name', async () => {
        let res = await request.get(config.api.campaigns)
        expect(res.statusCode).toEqual(404)
        expect(res.body.message).toEqual('Not found')
    })
}

describe('Campaign API ' + config.baseUrl + config.api.campaigns, CampaignInfoTest)