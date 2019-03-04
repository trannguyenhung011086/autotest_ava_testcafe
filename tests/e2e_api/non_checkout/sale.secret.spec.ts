import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let request = new Utils.SaleUtils
let access = new Utils.DbAccessUtils

import test from 'ava'

test.before(async t => {
    t.context['cookie'] = await request.getGuestCookie()
})

test('GET / cannot get secret sale when not call campaign API', async t => {
    const res = await request.get(config.api.secretSales, t.context['cookie'])

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(res.body.length, 0)
})

test('GET / check secret sale when not call campaign API', async t => {
    const res = await request.get(config.api.secretSales + '/check', t.context['cookie'])

    t.deepEqual(res.statusCode, 200)
    t.false(res.body)
})

test('GET / get secret sale when call campaign API', async t => {
    let campaign: Model.Campaign = await access.getCampaign({
        endDate: { $gt: new Date() }
    })

    t.truthy(campaign)

    await request.get(config.api.campaigns + campaign.name, t.context['cookie'])

    const res = await request.get(config.api.secretSales, t.context['cookie'])

    t.deepEqual(res.statusCode, 200)

    let sales: Model.SalesModel[] = res.body

    for (let sale of sales) {
        t.truthy(sale.title)
        t.truthy(sale.endTime)
        t.deepEqual(typeof (sale.potd), 'boolean')
        t.true(sale.slug.includes(sale.id))
        t.truthy(sale.categories)

        let saleInfo = await request.getSaleInfo(sale.id)

        t.true(saleInfo.campaign)
    }
})

test('GET / check secret sale when call campaign API', async t => {
    let campaign: Model.Campaign = await access.getCampaign({
        endDate: { $gt: new Date() }
    })

    t.truthy(campaign)

    await request.get(config.api.campaigns + campaign.name, t.context['cookie'])

    const res = await request.get(config.api.secretSales + '/check', t.context['cookie'])

    t.deepEqual(res.statusCode, 200)
    t.true(res.body)
})