import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let menu: Model.CategoryMenu
let topMenu: Model.TopMenu

let request = new Utils.Helper
let requestSale = new Utils.SaleUtils

import test, { ExecutionContext } from 'ava'

export async function validateCategory(t: ExecutionContext, menuItem: string) {
    let res = await request.get(menuItem)
    t.deepEqual(res.statusCode, 200)
    menu = res.body

    t.truthy(menu.id)
    t.deepEqual(menu.name, '')
    t.truthy(menu.displayName.vn)
    t.truthy(menu.displayName.en)
    t.deepEqual(menu.type, 'categories')

    menu.subitems.forEach(item => {
        t.truthy(item.id)
        t.deepEqual(item.name, '')
        t.truthy(item.displayName.vn)
        t.truthy(item.displayName.en)
        t.true(item.salesCount >= 0)
        t.true(item.slug.vn.includes(item.id))
        t.true(item.slug.en.includes(item.id))
    })

    t.truthy(menu.parent.id)
    t.truthy(menu.parent.displayName.vn)
    t.truthy(menu.parent.displayName.en)
    t.true(menu.slug.vn.includes(menu.id))
    t.true(menu.slug.en.includes(menu.id))
}

export async function validateSale(t: ExecutionContext, sale: Model.SalesModel) {
    t.truthy(sale.id)
    t.truthy(sale.title)
    t.truthy(sale.endTime)
    t.true(request.validateImage(sale.image1))
    t.deepEqual(typeof (sale.international), 'boolean')

    if (sale.potd === false) {
        t.true(sale.slug.includes(sale.id))
    } else if (sale.potd === true) {
        t.false(sale.slug.includes(sale.id))
    }
}

test('GET / invalid category ID', async t => {
    let res = await request.get('/api/menus/items/INVALID-ID')

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.error, 'Argument passed in must be a single String of 12 bytes or a string of 24 hex characters')

    res = await request.get('/api/menus/items/5b56d3448f0dd7c0480acd1c')

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.error, "Cannot read property 'subitems' of undefined")
})

test('GET / top menu', async t => {
    let res = await request.get(config.api.cateMenu)

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
    await validateCategory(t, config.api.cateApparel)
})

test('GET / valid category ID - accessories', async t => {
    await validateCategory(t, config.api.cateAccessories)
})

test('GET / valid category ID - bags shoes', async t => {
    await validateCategory(t, config.api.cateBagsShoes)
})

test('GET / valid category ID - health beauty', async t => {
    await validateCategory(t, config.api.cateHealthBeauty)
})

test('GET / valid category ID - home lifestyle', async t => {
    await validateCategory(t, config.api.cateHomeLifeStyle)
})

test('GET / get featured sales - apparel', async t => {
    let sales = await requestSale.getSales(config.api.cateApparel + '/sales/featured')

    for (let sale of sales) {
        await validateSale(t, sale)
    }
})

test('GET / get featured sales - accessories', async t => {
    let sales = await requestSale.getSales(config.api.cateAccessories + '/sales/featured')

    for (let sale of sales) {
        await validateSale(t, sale)
    }
})

test('GET / get featured sales - bags shoes', async t => {
    let sales = await requestSale.getSales(config.api.cateBagsShoes + '/sales/featured')

    for (let sale of sales) {
        await validateSale(t, sale)
    }
})

test('GET / get featured sales - health beauty', async t => {
    let sales = await requestSale.getSales(config.api.cateHealthBeauty + '/sales/featured')

    for (let sale of sales) {
        await validateSale(t, sale)
    }
})

test('GET / get featured sales - home lifestyle', async t => {
    let sales = await requestSale.getSales(config.api.cateHomeLifeStyle + '/sales/featured')

    for (let sale of sales) {
        await validateSale(t, sale)
    }
})

test('GET / get current sales - apparel', async t => {
    let featured = await request.get(config.api.cateApparel + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateApparel + '/sales/current')

    for (let sale of sales) {
        await validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})

test('GET / get current sales - accessories', async t => {
    let featured = await request.get(config.api.cateAccessories + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateAccessories + '/sales/current')

    for (let sale of sales) {
        await validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})

test('GET / get current sales - bags shoes', async t => {
    let featured = await request.get(config.api.cateBagsShoes + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateBagsShoes + '/sales/current')

    for (let sale of sales) {
        await validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})

test('GET / get current sales - health beauty', async t => {
    let featured = await request.get(config.api.cateHealthBeauty + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateHealthBeauty + '/sales/current')

    for (let sale of sales) {
        await validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})

test('GET / get current sales - home lifestyle', async t => {
    let featured = await request.get(config.api.cateHomeLifeStyle + '/sales/featured?limit=1')

    let sales = await requestSale.getSales(config.api.cateHomeLifeStyle + '/sales/current')

    for (let sale of sales) {
        await validateSale(t, sale)
        t.notDeepEqual(sale.id, featured.body.id)
    }
})