import { t, RequestMock } from 'testcafe'
import config from '../../../../config/config'
import * as Utils from '../../../../common/utils'
let api = new Utils.ApiUtils()
import * as model from '../../../../common/interface'
let sales: model.SalesModel[]
import Pages from '../../page_objects'
const page = new Pages()

// import * as got from 'got'

const mockRedirect = RequestMock()
    .onRequestTo(/\/api\/v2\/product\/(?!view-product)/)
    .respond({ 'code': 403 }, 403, { 'access-control-allow-origin': '*' })

const mockNonRedirect = RequestMock()
    .onRequestTo(/\/api\/v2\/product\/(?!view-product)/)
    .respond(null, 500, { 'access-control-allow-origin': '*' })

fixture('Check product detail page ' + config.baseUrl)

test.requestHooks(mockRedirect)
    ('Redirect to homepage when product API returns error', async () => {
        sales = await api.getSales(config.api.featuredSales)

        await t.navigateTo(config.baseUrl + '/vn/sales/' + sales[0].slug)
        await t.click('.product-card')

        let location = await t.eval(() => document.location.href)
        await t.expect(location).eql(config.baseUrl + '/vn')
    })

test.requestHooks(mockNonRedirect)
    ('Not redirect to homepage when product API returns error', async () => {
        sales = await api.getSales(config.api.featuredSales)

        await t.navigateTo(config.baseUrl + '/vn/sales/' + sales[0].slug)
        await t.click('.product-card')

        let location = await t.eval(() => document.location.href)
        await t.expect(location).notEql(config.baseUrl + '/vn')
    })