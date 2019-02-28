import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import faker from 'faker/locale/vi'
import * as Model from '../../common/interface'

let signIn: Model.SignIn
let request = new Utils.AccountUtils

import test from 'ava'

test('POST / wrong email', async t => {
    let res = await request.post(config.api.signIn,
        {
            "email": 'QA_' + faker.internet.email(),
            "password": faker.internet.password()
        })

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'EMAIL_PASSWORD_INCORRECT')
})

test('POST / wrong password', async t => {
    let res = await request.post(config.api.signIn,
        {
            "email": config.testAccount.email_ex_1,
            "password": faker.internet.password()
        })

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'EMAIL_PASSWORD_INCORRECT')
})

test('POST / use Facebook email', async t => {
    let res = await request.post(config.api.signIn,
        {
            "email": config.testAccount.facebook,
            "password": config.testAccount.passwordFacebook
        })

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'EMAIL_PASSWORD_INCORRECT')
})

test('POST / missing email field', async t => {
    let res = await request.post(config.api.signIn,
        {
            "password": faker.internet.password()
        })

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'EMAIL_PASSWORD_INCORRECT')
})

test('POST / missing password field', async t => {
    let res = await request.post(config.api.signIn,
        {
            "email": 'QA_' + faker.internet.email()
        })

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'EMAIL_PASSWORD_INCORRECT')
})

test('POST / empty email and password', async t => {
    let res = await request.post(config.api.signIn,
        {
            "email": "",
            "password": ""
        })

    t.deepEqual(res.statusCode, 401)
    t.deepEqual(res.body.message, 'EMAIL_PASSWORD_INCORRECT')
})

test('POST / correct email and password - external email', async t => {
    let res = await request.post(config.api.signIn,
        {
            "email": config.testAccount.email_ex_1.toUpperCase(),
            "password": config.testAccount.password_ex_1
        })
    signIn = res.body

    t.deepEqual(res.statusCode, 200)
    t.truthy(signIn.id.length)
    t.deepEqual(typeof (signIn.firstName), 'string')
    t.deepEqual(typeof (signIn.lastName), 'string')
    t.deepEqual(signIn.email, config.testAccount.email_ex_1.toLowerCase())
    t.regex(signIn.language, /en|vn/)
    t.deepEqual(typeof (signIn.accountCredit), 'number')
    t.deepEqual(signIn.provider, 'local')
    t.deepEqual(signIn.state, 'confirmed')
    t.false(signIn.preview)
    t.deepEqual(typeof (signIn.gender), 'string')
    t.true(Array.isArray(signIn.cart))
})

test('POST / correct email and password - internal email', async t => {
    let res = await request.post(config.api.signIn,
        {
            "email": config.testAccount.email_in,
            "password": config.testAccount.password_in
        })
    signIn = res.body

    t.deepEqual(res.statusCode, 200)
    t.true(signIn.preview)
})

test('GET / sign out', async t => {
    let cookie = await request.getLogInCookie(config.testAccount.email_in,
        config.testAccount.password_in)
    let res = await request.get(config.api.signOut, cookie)

    t.deepEqual(res.statusCode, 200)
    t.deepEqual(res.body.message, 'SIGNED_OUT_SUCCESSFUL')
})