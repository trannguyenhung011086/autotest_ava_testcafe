import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as Model from '../../../common/interface'

let giftCard: Model.Giftcard
let giftcardInfo: Model.GiftcardModel

let helper = new Utils.Helper
let access = new Utils.DbAccessUtils

import test from 'ava'

test.before(async t => {
    t.context['cookie'] = await helper.getLogInCookie(config.testAccount.email_ex[10],
        config.testAccount.password_ex)
})

test.serial('GET / check invalid giftcard', async t => {
    const res = await helper.get(config.api.giftcard + 'INVALID-ID', t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
})

test.serial('GET / check redeemed giftcard', async t => {
    giftcardInfo = await access.getGiftCard({ redeemed: true })

    const res = await helper.get(config.api.giftcard + giftcardInfo.code, t.context['cookie'])

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'COULD_NOT_LOAD_GIFTCARD_OR_INVALID')
})

test.serial('GET / check not redeemed giftcard', async t => {
    giftcardInfo = await access.getGiftCard({ redeemed: false })

    const res = await helper.get(config.api.giftcard + giftcardInfo.code, t.context['cookie'])
    giftCard = res.body

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(giftCard.code, giftcardInfo.code)
    t.truthy(giftCard.id)
    t.true(giftCard.amount >= 0)
})

test.serial('GET / cannot check giftcard with invalid cookie', async t => {
    const res = await helper.get(config.api.giftcard + 'CARD-ID', 'leflair.connect2.sid=test')

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'Access denied.')
})