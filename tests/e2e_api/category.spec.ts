import config from '../../config/config'
import * as Utils from '../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import * as model from '../../common/interface'
let menu: model.CategoryMenu

describe('Category menu API ' + config.baseUrl + '/api/menus/items/<cateID>', () => {
    test('GET / invalid category ID', async () => {
        let response = await request.get('/api/menus/items/INVALID-ID')
        expect(response.status).toEqual(500)
        expect(response.data.error).toEqual('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters')

        response = await request.get('/api/menus/items/5b56d3448f0dd7c0480acd1c')
        expect(response.status).toEqual(500)
        expect(response.data.error).toEqual("Cannot read property 'subitems' of undefined")
    })

    test.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / valid category ID - %s', async (menuItem) => {
        let response = await request.get(menuItem)
        expect(response.status).toEqual(200)
        menu = response.data

        expect(menu.id).not.toBeEmpty()
        expect(menu.name).toBeString()
        expect(menu.displayName.vn).not.toBeEmpty()
        expect(menu.displayName.en).not.toBeEmpty()
        expect(menu.type).toEqual('categories')

        for (let item of menu.subitems) {
            expect(item.id).not.toBeEmpty()
            expect(item.name).toBeString()
            expect(item.displayName.vn).not.toBeEmpty()
            expect(item.displayName.en).not.toBeEmpty()
            expect(item.salesCount).toBeNumber()
            expect(item.slug.vn).toInclude(item.id)
            expect(item.slug.en).toInclude(item.id)
        }

        expect(menu.parent.id).not.toBeEmpty()
        expect(menu.parent.displayName.vn).not.toBeEmpty()
        expect(menu.parent.displayName.en).not.toBeEmpty()
        expect(menu.slug.vn).toInclude(menu.id)
        expect(menu.slug.en).toInclude(menu.id)
    })

    test.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get featured sales - %s', async (menuItem) => {
        let sales = await request.getSales(menuItem + '/sales/featured')

        for (let sale of sales) {
            expect(sale.id).not.toBeEmpty()
            expect(sale.title).not.toBeEmpty()
            expect(sale.endTime).not.toBeEmpty()
            expect(sale.image1.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)
            expect(sale.slug).toInclude(sale.id)
            expect(sale.international).toBeBoolean()
        }
    })

    test.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get featured sales limit 1 - %s', async (menuItem) => {
        let sale = await request.get(menuItem + '/sales/featured?limit=1')
        expect(sale.data).toBeObject()
    })

    test.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get current sales - %s', async (menuItem) => {
        let sales = await request.getSales(menuItem + '/sales/current')

        for (let sale of sales) {
            expect(sale.id).not.toBeEmpty()
            expect(sale.title).not.toBeEmpty()
            expect(sale.endTime).not.toBeEmpty()
            expect(sale.image1.toLowerCase()).toMatch(/\.jpg|\.png|\.jpeg|\.jpe/)

            if (sale.potd == false) {
                expect(sale.slug).toInclude(sale.id)
            }

            expect(sale.potd).toBeBoolean()
            expect(sale.international).toBeBoolean()
        }
    })

    test.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get current sales limit 1 - %s', async (menuItem) => {
        let sales = await request.getSales(menuItem + '/sales/current?limit=1')
        expect(sales).toBeArrayOfSize(1)
    })

    test.each([
        config.api.cateApparel,
        config.api.cateAccessories,
        config.api.cateBagsShoes,
        config.api.cateHealthBeauty,
        config.api.cateHomeLifeStyle
    ])('GET / get current sales excluding featured sales - %s', async (menuItem) => {
        let featured = await request.get(menuItem + '/sales/featured?limit=1')
        let sales = await request.getSales(config.api.cateApparel +
            '/sales/current?excludeId=' + featured.data.id)

        for (let sale of sales) {
            expect(sale.id).not.toEqual(featured.data.id)
        }
    })
})