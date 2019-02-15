import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as model from '../../../common/interface'

let cookie: string
let voucher: model.Voucher
let voucherInfo: model.VoucherModel
let customer: model.Customer

let helper = new Utils.Helper
let access = new Utils.DbAccessUtils

export const VoucherTest = () => {
    beforeAll(async () => {
        cookie = await helper.getLogInCookie(config.testAccount.email, config.testAccount.password)
        customer = await access.getCustomerInfo({ email: config.testAccount.email })
    })

    it('GET / check invalid voucher', async () => {
        let res = await helper.get(config.api.voucher + 'INVALID-ID', cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('VOUCHER_NOT_EXISTS')
    })

    it('GET / check expired voucher', async () => {
        voucherInfo = await access.getVoucher({
            startDate: { $gt: new Date('2018-11-01T14:56:59.301Z') },
            expiry: { $lt: new Date() }
        })

        let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('VOUCHER_CAMPAIGN_INVALID_OR_ENDED')
    })

    it('GET / check not started voucher', async () => {
        voucherInfo = await access.getVoucher({
            startDate: { $gt: new Date() }
        })

        let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('VOUCHER_CAMPAIGN_INVALID_OR_NOT_STARTED')
    })

    it('GET / check redeemed voucher', async () => {
        voucherInfo = await access.getVoucher({
            startDate: { $gt: new Date('2018-11-01T14:56:59.301Z') },
            expiry: { $gte: new Date() },
            used: true
        })

        let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('VOUCHER_HAS_BEEN_REDEEMED')
    })

    it('GET / check already used voucher', async () => {
        let voucher = await access.getUsedVoucher({
            expiry: { $gte: new Date() },
            binRange: { $exists: false },
            used: false,
            oncePerAccount: true
        }, customer)

        let res = await helper.get(config.api.voucher + voucher.code, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('YOU_ALREADY_USED_THIS_VOUCHER')
    })

    it('GET / check not allowed to use voucher ', async () => {
        voucherInfo = await access.getVoucher({
            expiry: { $gte: new Date() },
            customer: { $exists: true }
        })

        let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)
        expect(res.statusCode).toEqual(400)
        expect(res.body.message).toEqual('NOT_ALLOWED_TO_USE_VOUCHER')
    })

    it('GET / check valid voucher', async () => {
        voucherInfo = await access.getVoucher({
            expiry: { $gte: new Date() },
            oncePerAccount: false,
            used: false
        })

        let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)
        voucher = res.body

        expect(res.statusCode).toEqual(200)
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
        let res = await helper.get(config.api.voucher + 'CARD-ID', 'leflair.connect2.sid=test')
        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Access denied.')
    })

    it('GET / cannot check voucher without login', async () => {
        await helper.get(config.api.signOut, cookie)
        let res = await helper.get(config.api.voucher + 'CARD-ID', cookie)
        expect(res.statusCode).toEqual(401)
        expect(res.body.message).toEqual('Access denied.')
    })
}

describe('Voucher API ' + config.baseUrl + config.api.voucher, VoucherTest)