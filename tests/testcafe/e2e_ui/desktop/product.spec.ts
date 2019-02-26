import { t, RequestMock } from 'testcafe'
import { config } from '../../../../common/config'
import * as Utils from '../../../../common/utils'
import * as model from '../../../../common/interface'
import { Pages } from '../page_objects'

let sales: model.SalesModel[]

let requestSale = new Utils.SaleUtils
const page = new Pages()

const mockRedirect = RequestMock()
    .onRequestTo(/\/api\/v2\/product\/(?!view-product)/)
    .respond({ 'code': 403 }, 403, { 'access-control-allow-origin': '*' })

const mockNonRedirect = RequestMock()
    .onRequestTo(/\/api\/v2\/product\/(?!view-product)/)
    .respond(null, 500, { 'access-control-allow-origin': '*' })

fixture('Check product detail page ' + config.baseUrl)
    .meta({ type: 'regression' })

test.requestHooks(mockRedirect)
    ('Redirect to homepage when product API returns 403 error code', async () => {
        sales = await requestSale.getSales(config.api.featuredSales)

        await t
            .navigateTo(config.baseUrl + '/vn/sales/' + sales[0].slug)
            .click('.product-card')

        let location = await t.eval(() => document.location.href)
        await t.expect(location).eql(config.baseUrl + '/vn')
    })

test.requestHooks(mockNonRedirect)
    ('Not redirect to homepage when product API returns 500 error code', async () => {
        sales = await requestSale.getSales(config.api.featuredSales)

        await t
            .navigateTo(config.baseUrl + '/vn/sales/' + sales[0].slug)
            .click('.product-card')

        let location = await t.eval(() => document.location.href)
        await t.expect(location).notEql(config.baseUrl + '/vn')
    })