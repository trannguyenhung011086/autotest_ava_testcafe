import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as faker from 'faker/locale/vi'
import * as Model from '../../../common/interface'

let signIn: Model.SignIn

let request = new Utils.AccountUtils

import test from 'ava'

test.beforeEach(async t => {
    t.context['cookie'] = await request.pickRandomUser(config.testAccount.email_ex)
})

test('GET / get account info', async t => {
    const res = await request.get(config.api.account, t.context['cookie'])
    const account: Model.Account = res.body

    t.deepEqual(res.statusCode, 200)
    t.truthy(account.id)
    t.true(request.validateEmail(account.email))
    t.true(account.hasOwnProperty('firstName'))
    t.true(account.hasOwnProperty('lastName'))
    t.regex(account.language, /en|vn/)
    t.deepEqual(typeof (account.accountCredit), 'number')
    t.deepEqual(account.provider, 'local')
    t.deepEqual(account.state, 'confirmed')
    t.truthy(account.gender)
    t.truthy(account.cart)

    if (account.stripe && Object.keys(account.stripe).length > 0) {
        t.truthy(account.stripe.customerId)
    }
    if (account.nsId) {
        t.truthy(account.nsId)
    }
})

test('PUT / can change name', async t => {
    let firstName = 'QA_' + faker.name.firstName()
    let lastName = 'QA_' + faker.name.lastName()

    const res = await request.put(config.api.account, {
        "firstName": firstName,
        "lastName": lastName
    }, t.context['cookie'])
    signIn = res.body

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(signIn.firstName, firstName)
    t.deepEqual(signIn.lastName, lastName)
})

test.skip('PUT / cannot change email', async t => {
    const res = await request.put(config.api.account, {
        "email": 'new-' + config.testAccount.email_ex[2]
    }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'USER_UPDATE_ERROR')
}) // wait for WWW-335

test('PUT / cannot update with wrong cookie', async t => {
    const res = await request.put(config.api.account, {
        "firstName": "first",
        "lastName": "last"
    }, 'leflair.connect2.sid=test')

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'Access denied.')
})

test('PUT / wrong current password', async t => {
    const res = await request.put(config.api.password,
        {
            "currentPassword": faker.internet.password(),
            "newPassword": faker.internet.password()
        }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'COULD_NOT_CHANGE_PASSWORD')
})

test('PUT / empty current password', async t => {
    const res = await request.put(config.api.password,
        {
            "currentPassword": "",
            "newPassword": faker.internet.password()
        }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'COULD_NOT_CHANGE_PASSWORD')
})

test('PUT / new password has length < 7', async t => {
    const res = await request.put(config.api.password,
        {
            "currentPassword": 'leflairqa',
            "newPassword": "123456"
        }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'COULD_NOT_CHANGE_PASSWORD')
})

test('PUT / empty new password', async t => {
    const res = await request.put(config.api.password,
        {
            "currentPassword": 'leflairqa',
            "newPassword": ""
        }, t.context['cookie'])

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'COULD_NOT_CHANGE_PASSWORD')
})

test('PUT / can change password', async t => {
    const res = await request.put(config.api.password,
        {
            "currentPassword": config.testAccount.password_ex,
            "newPassword": config.testAccount.password_ex
        }, t.context['cookie'])

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(res.body.message, 'PASSWORD_CHANGED')
})

test('PUT / cannot update password with wrong cookie', async t => {
    const res = await request.put(config.api.password,
        {
            "currentPassword": 'leflairqa',
            "newPassword": 'leflairqa'
        }, 'leflair.connect2.sid=test')

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'Access denied.')
})