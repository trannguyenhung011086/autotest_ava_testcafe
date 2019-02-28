import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let request = new Utils.Helper
let access = new Utils.DbAccessUtils

import test from 'ava'

test('GET / valid campaign name', async t => {
    let campaign: Model.Campaign = await access.getCampaign({
        endDate: { $gt: new Date() }
    })

    t.truthy(campaign)

    let res = await request.get(config.api.campaigns + campaign.name)

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(res.body.message, 'SET')

    res = await request.get(config.api.campaigns + campaign.name)

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(res.body.message, 'NO_CHANGE')
})

test('GET / invalid campaign name', async t => {
    let res = await request.get(config.api.campaigns + 'INVALID-CAMPAIGN')

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'NOT_FOUND')
})

test('GET / missing campaign name', async t => {
    let res = await request.get(config.api.campaigns)

    t.deepEqual(res.statusCode, 404)
    t.deepEqual(res.body.message, 'Not found')
})