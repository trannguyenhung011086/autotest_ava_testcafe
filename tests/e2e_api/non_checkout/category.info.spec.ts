import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let menu: Model.CategoryMenu
let topMenu: Model.TopMenu

let request = new Utils.Helper
let requestSale = new Utils.SaleUtils

import test from 'ava'

test('GET / invalid category ID', async t => {
    let res = await request.get('/api/menus/items/INVALID-ID')

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.error, 'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters')

    res = await request.get('/api/menus/items/5b56d3448f0dd7c0480acd1c')

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.error, "Cannot read property 'subitems' of undefined")
})

test('GET / top menu', async t => {
    const res = await request.get(config.api.cateMenu)

    t.deepEqual(res.statusCode, 200)
    topMenu = res.body

    t.truthy(topMenu.id)
    t.deepEqual(topMenu.code, 'TOP_NAV')
    t.deepEqual(topMenu.name, 'Top Navigation')
    t.deepEqual(topMenu.displayName.vn, 'Top Navigation')
    t.deepEqual(topMenu.displayName.en, 'Top Navigation')
    t.truthy(topMenu.description)

    topMenu.items.forEach(item => {
        t.truthy(item.id)
        t.deepEqual(item.name, '')
        t.truthy(item.displayName.vn)
        t.truthy(item.displayName.en)
        t.truthy(item.type)
        t.true(item.slug.vn.includes(item.id))
        t.true(item.slug.en.includes(item.id))
    })
})

test('GET / valid category ID - apparel', async t => {
    const res = await request.get(config.api.cateApparel)
    t.deepEqual(res.statusCode, 200)

    menu = res.body
    await request.validateCategory(t, menu)
})

test('GET / valid category ID - accessories', async t => {
    const res = await request.get(config.api.cateAccessories)
    t.deepEqual(res.statusCode, 200)

    menu = res.body
    await request.validateCategory(t, menu)
})

test('GET / valid category ID - bags shoes', async t => {
    const res = await request.get(config.api.cateBagsShoes)
    t.deepEqual(res.statusCode, 200)

    menu = res.body
    await request.validateCategory(t, menu)
})

test('GET / valid category ID - health beauty', async t => {
    const res = await request.get(config.api.cateHealthBeauty)
    t.deepEqual(res.statusCode, 200)

    menu = res.body
    await request.validateCategory(t, menu)
})

test('GET / valid category ID - home lifestyle', async t => {
    const res = await request.get(config.api.cateHomeLifeStyle)
    t.deepEqual(res.statusCode, 200)

    menu = res.body
    await request.validateCategory(t, menu)
})

test('GET / get featured sales - apparel', async t => {
    let sales = await requestSale.getSales(config.api.cateApparel + '/sales/featured')

    for (let sale of sales) {
        await request.validateSale(t, sale)
    }
})

test('GET / get featured sales - accessories', async t => {
    let sales = await requestSale.getSales(config.api.cateAccessories + '/sales/featured')

    for (let sale of sales) {
        await request.validateSale(t, sale)
    }
})

test('GET / get featured sales - bags shoes', async t => {
    let sales = await requestSale.getSales(config.api.cateBagsShoes + '/sales/featured')

    for (let sale of sales) {
        await request.validateSale(t, sale)
    }
})

test('GET / get featured sales - health beauty', async t => {
    let sales = await requestSale.getSales(config.api.cateHealthBeauty + '/sales/featured')

    for (let sale of sales) {
        await request.validateSale(t, sale)
    }
})

test('GET / get featured sales - home lifestyle', async t => {
    let sales = await requestSale.getSales(config.api.cateHomeLifeStyle + '/sales/featured')

    for (let sale of sales) {
        await request.validateSale(t, sale)
    }
})

test('GET / get current sales - apparel', async t => {
    let featured = await request.get(config.api.cateApparel + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateApparel + '/sales/current')

    for (let sale of sales) {
        await request.validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})

test('GET / get current sales - accessories', async t => {
    let featured = await request.get(config.api.cateAccessories + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateAccessories + '/sales/current')

    for (let sale of sales) {
        await request.validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})

test('GET / get current sales - bags shoes', async t => {
    let featured = await request.get(config.api.cateBagsShoes + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateBagsShoes + '/sales/current')

    for (let sale of sales) {
        await request.validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})

test('GET / get current sales - health beauty', async t => {
    let featured = await request.get(config.api.cateHealthBeauty + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateHealthBeauty + '/sales/current')

    for (let sale of sales) {
        await request.validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})

test('GET / get current sales - home lifestyle', async t => {
    let featured = await request.get(config.api.cateHomeLifeStyle + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateHomeLifeStyle + '/sales/current')

    for (let sale of sales) {
        await request.validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})