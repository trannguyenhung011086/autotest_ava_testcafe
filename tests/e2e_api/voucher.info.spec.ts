import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let cookie: string
let voucher: Model.Voucher
let voucherInfo: Model.VoucherModel
let customer: Model.Customer

let helper = new Utils.Helper
let access = new Utils.DbAccessUtils

import test from 'ava'

test.before(async t => {
    cookie = await helper.getLogInCookie(config.testAccount.email_ex_1,
        config.testAccount.password_ex_1)
    customer = await access.getCustomerInfo({ email: config.testAccount.email_ex_1 })
})

test.serial('GET / check invalid voucher', async t => {
    let res = await helper.get(config.api.voucher + 'INVALID-ID', cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'VOUCHER_NOT_EXISTS')
})

test.serial('GET / check expired voucher', async t => {
    voucherInfo = await access.getVoucher({
        expiry: { $lt: new Date() }
    })

    t.truthy(voucherInfo)

    let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'VOUCHER_CAMPAIGN_INVALID_OR_ENDED')
})

test.serial('GET / check not started voucher', async t => {
    voucherInfo = await access.getVoucher({
        startDate: { $gt: new Date() }
    })

    t.truthy(voucherInfo)

    let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'VOUCHER_CAMPAIGN_INVALID_OR_NOT_STARTED')
})

test.serial('GET / check redeemed voucher', async t => {
    voucherInfo = await access.getVoucher({
        startDate: { $gt: new Date('2018-11-01T14:56:59.301Z') },
        expiry: { $gte: new Date() },
        used: true
    })

    t.truthy(voucherInfo)

    let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'VOUCHER_HAS_BEEN_REDEEMED')
})

test.serial('GET / check already used voucher', async t => {
    let voucher = await access.getUsedVoucher({
        expiry: { $gte: new Date() },
        binRange: { $exists: false },
        used: false,
        oncePerAccount: true
    }, customer)

    t.truthy(voucher)

    let res = await helper.get(config.api.voucher + voucher.code, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'YOU_ALREADY_USED_THIS_VOUCHER')
})

test.serial('GET / check not allowed to use voucher ', async t => {
    voucherInfo = await access.getVoucher({
        expiry: { $gte: new Date() },
        customer: { $exists: true }
    })

    t.truthy(voucherInfo)

    let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'NOT_ALLOWED_TO_USE_VOUCHER')
})

test.serial('GET / check valid voucher', async t => {
    voucherInfo = await access.getVoucher({
        expiry: { $gte: new Date() },
        oncePerAccount: false,
        used: false
    })

    t.truthy(voucherInfo)

    let res = await helper.get(config.api.voucher + voucherInfo.code, cookie)
    voucher = res.body

    t.deepEqual(res.statusCode, 200)
    t.true(voucher.amount > 0)
    t.deepEqual(voucher.code, voucherInfo.code)
    t.regex(voucher.discountType, /amount|percentage/)
    t.deepEqual(typeof (voucher.freeShipping), 'boolean')
    t.truthy(voucher.id)
    t.true(voucher.hasOwnProperty('maximumDiscountAmount'))
    t.true(voucher.hasOwnProperty('minimumPurchase'))
    t.true(voucher.hasOwnProperty('numberOfItems'))
    t.true(voucher.hasOwnProperty('specificDays'))
})

test.serial('GET / cannot check voucher with invalid cookie', async t => {
    let res = await helper.get(config.api.voucher + 'CARD-ID', 'leflair.connect2.sid=test')

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'Access denied.')
})

test.serial('GET / cannot check voucher without login', async t => {
    await helper.get(config.api.signOut, cookie)
    let res = await helper.get(config.api.voucher + 'CARD-ID', cookie)

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'Access denied.')
})