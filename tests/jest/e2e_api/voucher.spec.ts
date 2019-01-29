import config from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
let access = new Utils.MongoUtils()
import 'jest-extended'
import * as model from '../../../common/interface'
let cookie: string
let voucher: model.Voucher
let voucherInfo: model.VoucherModel
let customer: model.Customer

export const VoucherTest = () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
        customer = await access.getCustomerInfo({ email: config.testAccount.email })
    })

    it('GET / check invalid voucher', async () => {
        let response = await request.get(config.api.voucher + 'INVALID-ID')
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_NOT_EXISTS')
    })

    it('GET / check expired voucher', async () => {
        voucherInfo = await access.getVoucher({
            startDate: { $gt: new Date('2018-11-01T14:56:59.301Z') },
            expiry: { $lt: new Date() }
        })

        let response = await request.get(config.api.voucher + voucherInfo.code)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_CAMPAIGN_INVALID_OR_ENDED')
    })

    it('GET / check not started voucher', async () => {
        voucherInfo = await access.getVoucher({
            startDate: { $gt: new Date() }
        })

        let response = await request.get(config.api.voucher + voucherInfo.code)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_CAMPAIGN_INVALID_OR_NOT_STARTED')
    })

    it('GET / check redeemed voucher', async () => {
        voucherInfo = await access.getVoucher({
            startDate: { $gt: new Date('2018-11-01T14:56:59.301Z') },
            expiry: { $gte: new Date() },
            used: true
        })

        let response = await request.get(config.api.voucher + voucherInfo.code)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_HAS_BEEN_REDEEMED')
    })

    it('GET / check already used voucher', async () => {
        let item = await request.getInStockProduct(config.api.currentSales, 1)
        await request.addToCart(item.id)

        let voucher = await access.getNotUsedVoucher({
            expiry: { $gte: new Date() },
            used: false,
            discountType: 'amount',
            minimumPurchase: 0,
            numberOfItems: 0,
            oncePerAccount: true
        }, customer)

        await request.createCodOrder([item], voucher._id)

        let response = await request.get(config.api.voucher + voucher.code)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('YOU_ALREADY_USED_THIS_VOUCHER')
    })

    it('GET / check not allowed to use voucher', async () => {
        voucherInfo = await access.getVoucher({
            expiry: { $gte: new Date() },
            customer: { $exists: true }
        })

        let response = await request.get(config.api.voucher + voucherInfo.code)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('NOT_ALLOWED_TO_USE_VOUCHER')
    })

    it('GET / check valid voucher', async () => {
        voucherInfo = await access.getVoucher({
            startDate: { $gt: new Date('2018-11-01T14:56:59.301Z') },
            expiry: { $gte: new Date() },
            oncePerAccount: false,
            used: false
        })

        let response = await request.get(config.api.voucher + voucherInfo.code)
        voucher = response.data
        expect(response.status).toEqual(200)
        expect(voucher.amount).toBeGreaterThan(0)
        expect(voucher.code).toEqual(voucherInfo.code)
        expect(voucher.discountType).toMatch(/amount|percentage/)
        expect(voucher.freeShipping).toBeBoolean()
        expect(voucher.id).not.toBeEmpty()
        expect(voucher).toContainKeys(['maximumDiscountAmount', 'minimumPurchase'])
        expect(voucher.numberOfItems).toBeNumber()
        expect(voucher.specificDays).toBeArray()
    })

    it('GET / cannot check voucher with invalid cookie', async () => {
        let response = await request.get(config.api.voucher + 'CARD-ID', 'abc')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })

    it('GET / cannot check voucher without login', async () => {
        await request.get(config.api.signOut)
        let response = await request.get(config.api.voucher + 'CARD-ID')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
}

describe('Voucher API ' + config.baseUrl + config.api.voucher, VoucherTest)