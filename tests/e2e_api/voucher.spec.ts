import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()
import * as model from '../../common/interface'
let cookie: string
let voucher: model.Voucher
let voucherInfo: model.VoucherModel

describe('Voucher API ' + config.baseUrl + config.api.voucher, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    test('GET / check invalid voucher', async () => {
        let response = await request.get(config.api.voucher + 'INVALID-ID', cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_NOT_EXISTS')
    })

    test('GET / check expired voucher', async () => {
        voucherInfo = await request.getVoucher({
            startDate: { $gt: new Date('2018-11-01T14:56:59.301Z') },
            expiry: { $lt: new Date() }
        })
        let response = await request.get(config.api.voucher + voucherInfo.code, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_CAMPAIGN_INVALID_OR_ENDED')
    })

    test('GET / check not started voucher', async () => {
        voucherInfo = await request.getVoucher({
            startDate: { $gt: new Date() }
        })
        if (voucherInfo) {
            let response = await request.get(config.api.voucher + voucherInfo.code, cookie)
            expect(response.status).toEqual(400)
            expect(response.data.message).toEqual('VOUCHER_CAMPAIGN_INVALID_OR_NOT_STARTED')
        }
    })

    test('GET / check redeemed voucher', async () => {
        voucherInfo = await request.getVoucher({
            startDate: { $gt: new Date('2018-11-01T14:56:59.301Z') },
            expiry: { $gte: new Date() },
            used: true
        })
        let response = await request.get(config.api.voucher + voucherInfo.code, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('VOUCHER_HAS_BEEN_REDEEMED')
    })

    test.skip('GET / check already used voucher', async () => {
        let response = await request.get(config.api.voucher + config.testAccount.usedVoucher, cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('YOU_ALREADY_USED_THIS_VOUCHER')
    }) // wait for WWW-349

    test('GET / check not allowed to use voucher', async () => {
        voucherInfo = await request.getVoucher({
            expiry: { $gte: new Date() },
            customer: { $exists: true }
        })
        if (voucherInfo) {
            let response = await request.get(config.api.voucher + voucherInfo.code, cookie)
            expect(response.status).toEqual(400)
            expect(response.data.message).toEqual('NOT_ALLOWED_TO_USE_VOUCHER')
        }
    })

    test('GET / check valid voucher', async () => {
        voucherInfo = await request.getVoucher({
            startDate: { $gt: new Date('2018-11-01T14:56:59.301Z') },
            expiry: { $gte: new Date() },
            used: false
        })
        let response = await request.get(config.api.voucher + voucherInfo.code, cookie)
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

    test('GET / cannot check voucher with invalid cookie', async () => {
        let response = await request.get(config.api.voucher + 'CARD-ID', cookie = 'abc')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })

    test('GET / cannot check voucher without login', async () => {
        let response = await request.get(config.api.voucher + 'CARD-ID')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
})