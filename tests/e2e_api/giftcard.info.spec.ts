import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import * as Model from '../../common/interface'

let cookie: string
let giftCard: Model.Giftcard
let giftcardInfo: Model.GiftcardModel

let helper = new Utils.Helper
let access = new Utils.DbAccessUtils

import test from 'ava'

test.before(async t => {
    cookie = await helper.getLogInCookie(config.testAccount.email_ex_1,
        config.testAccount.password_ex_1)
})

test.serial('GET / check invalid giftcard', async t => {
    let res = await helper.get(config.api.giftcard + 'INVALID-ID', cookie)

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
})

test.serial('GET / check redeemed giftcard', async t => {
    giftcardInfo = await access.getGiftCard({ redeemed: true })

    let res = await helper.get(config.api.giftcard + giftcardInfo.code, cookie)

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
})

test.serial('GET / check not redeemed giftcard', async t => {
    giftcardInfo = await access.getGiftCard({ redeemed: false })

    let res = await helper.get(config.api.giftcard + giftcardInfo.code, cookie)
    giftCard = res.body

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(giftCard.code, giftcardInfo.code)
    t.truthy(giftCard.id)
    t.true(giftCard.amount >= 0)
})

test.serial('GET / cannot check giftcard with invalid cookie', async t => {
    let res = await helper.get(config.api.giftcard + 'CARD-ID', 'leflair.connect2.sid=test')

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'Access denied.')
})