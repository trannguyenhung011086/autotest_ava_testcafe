import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import faker from 'faker/locale/vi'
import * as Model from '../../common/interface'

let signUp: Model.SignIn
let request = new Utils.AccountUtils

import test from 'ava'

test('POST / empty email and password', async t => {
    let res = await request.post(config.api.signUp,
        {
            "email": "",
            "password": "",
            "language": "vn",
            "gender": "M"
        })

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'EMAIL_ADDRESS_REQUIRED')
})

test('POST / wrong format email', async t => {
    let res = await request.post(config.api.signUp,
        {
            "email": ".test%!@#$%^&*()_+<>?@mail.com",
            "password": faker.internet.password,
            "language": "vn",
            "gender": "M"
        })

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'REGISTER_INVALID_EMAIL')
})

test('POST / length < 7 password', async t => {
    let res = await request.post(config.api.signUp,
        {
            "email": 'QA_' + faker.internet.email(),
            "password": "123",
            "language": "vn",
            "gender": "M"
        })

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'User validation failed: password: Password should be longer')
})

test('POST / existing account', async t => {
    let res = await request.post(config.api.signUp,
        {
            "email": config.testAccount.email_ex_1,
            "password": config.testAccount.password_ex_1,
            "language": "vn",
            "gender": "M"
        })

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'EMAIL_ALREADY_EXISTS')
})

test('POST / missing email field', async t => {
    let res = await request.post(config.api.signUp,
        {
            "password": faker.internet.password()
        })

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'EMAIL_ADDRESS_REQUIRED')
})

test('POST / missing password field', async t => {
    let res = await request.post(config.api.signUp,
        {
            "email": 'QA_' + faker.internet.email()
        })

    t.deepEqual(res.statusCode, 500)
    t.deepEqual(res.body.message, 'User validation failed: password: Password should be longer')
})

test('POST / successful', async t => {
    const email = 'QA_' + faker.internet.email()
    let res = await request.post(config.api.signUp,
        {
            "email": email,
            "password": faker.internet.password(),
            "language": "vn",
            "gender": "M"
        })
    signUp = res.body

    t.deepEqual(res.statusCode, 200)
    t.truthy(signUp.id)
    t.falsy(signUp.firstName)
    t.falsy(signUp.lastName)
    t.deepEqual(signUp.email, email.toLowerCase())
    t.deepEqual(signUp.language, 'vn')
    t.deepEqual(signUp.accountCredit, 0)
    t.deepEqual(signUp.provider, 'local')
    t.deepEqual(signUp.state, 'confirmed')
    t.false(signUp.preview)
    t.deepEqual(signUp.gender, 'M')
    t.deepEqual(signUp.cart.length, 0)
})