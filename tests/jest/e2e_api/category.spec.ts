import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../../common/interface'
let menu: model.CategoryMenu
let topMenu: model.TopMenu

export const CategoryTest = () => {
    it('GET / invalid category ID', async () => {
        let res = await request.get('/api/menus/items/INVALID-ID')
        expect(res.statusCode).toEqual(500)
        expect(res.body.error).toEqual('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters')

        res = await request.get('/api/menus/items/5b56d3448f0dd7c0480acd1c')
        expect(res.statusCode).toEqual(500)
        expect(res.body.error).toEqual("Cannot read property 'subitems' of undefined")
    })

    it('GET / top menu', async () => {
        let res = await request.get(config.api.cateMenu)
        expect(res.statusCode).toEqual(200)
        topMenu = res.body

        expect(topMenu.id).not.toBeEmpty()
        expect(topMenu.code).toEqual('TOP_NAV')
        expect(topMenu.name).toEqual('Top Navigation')
        expect(topMenu.displayName.vn).toEqual('Top Navigation')
        expect(topMenu.displayName.en).toEqual('Top Navigation')
        expect(topMenu.description).not.toBeEmpty()

        topMenu.items.forEach(item => {
            expect(item.id).not.toBeEmpty()
            expect(item.name).toBeString()
            expect(item.displayName.vn).not.toBeEmpty()
            expect(item.displayName.en).not.toBeEmpty()
            expect(item.type).not.toBeEmpty()
            expect(item.slug.vn).toInclude(item.id)
            expect(item.slug.en).toInclude(item.id)
        })
    })

    it.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / valid category ID - %s', async (menuItem) => {
        let res = await request.get(menuItem)
        expect(res.statusCode).toEqual(200)
        menu = res.body

        expect(menu.id).not.toBeEmpty()
        expect(menu.name).toBeString()
        expect(menu.displayName.vn).not.toBeEmpty()
        expect(menu.displayName.en).not.toBeEmpty()
        expect(menu.type).toEqual('categories')

        menu.subitems.forEach(item => {
            expect(item.id).not.toBeEmpty()
            expect(item.name).toBeString()
            expect(item.displayName.vn).not.toBeEmpty()
            expect(item.displayName.en).not.toBeEmpty()
            expect(item.salesCount).toBeNumber()
            expect(item.slug.vn).toInclude(item.id)
            expect(item.slug.en).toInclude(item.id)
        })

        expect(menu.parent.id).not.toBeEmpty()
        expect(menu.parent.displayName.vn).not.toBeEmpty()
        expect(menu.parent.displayName.en).not.toBeEmpty()
        expect(menu.slug.vn).toInclude(menu.id)
        expect(menu.slug.en).toInclude(menu.id)
    })

    it.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get featured sales - %s', async (menuItem) => {
        let sales = await request.getSales(menuItem + '/sales/featured')

        sales.forEach(sale => {
            expect(sale.id).not.toBeEmpty()
            expect(sale.title).not.toBeEmpty()
            expect(sale.endTime).not.toBeEmpty()
            expect(sale.image1.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
            expect(sale.slug).toInclude(sale.id)
            expect(sale.international).toBeBoolean()
        })
    })

    it.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get featured sales limit 1 - %s', async (menuItem) => {
        let sale = await request.get(menuItem + '/sales/featured?limit=1')
        expect(sale.body).toBeObject()
    })

    it.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get current sales - %s', async (menuItem) => {
        let sales = await request.getSales(menuItem + '/sales/current')

        sales.forEach(sale => {
            expect(sale.id).not.toBeEmpty()
            expect(sale.title).not.toBeEmpty()
            expect(sale.endTime).not.toBeEmpty()
            expect(sale.image1.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)

            if (sale.potd == false) {
                expect(sale.slug).toInclude(sale.id)
            } else {
                expect(sale.slug).not.toInclude(sale.id)
            }

            expect(sale.international).toBeBoolean()
        })
    })

    it.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get current sales limit 1 - %s', async (menuItem) => {
        let sales = await request.getSales(menuItem + '/sales/current?limit=1')
        expect(sales).toBeArrayOfSize(1)
    })

    it.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get current sales excluding featured sales - %s', async (menuItem) => {
        let featured = await request.get(menuItem + '/sales/featured?limit=1')
        let sales = await request.getSales(config.api.cateApparel +
            '/sales/current?excludeId=' + featured.body.id)

        sales.forEach(sale => {
            expect(sale.id).not.toEqual(featured.body.id)
        })
    })
}

describe('Category menu API ' + config.baseUrl + '/api/menus/items/<cateID>', CategoryTest)