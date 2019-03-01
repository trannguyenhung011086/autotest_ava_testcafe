import { config } from '../../common/config'
import * as Utils from '../../common/utils'
import faker from 'faker/locale/vi'

let request = new Utils.AccountUtils

import test from 'ava'

test('POST / empty password', async t => {
    const res = await request.post(config.api.reset, {
        "password": "",
        "token": "TEST_TOKEN"
    })

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'RESET_INVALID_PASSWORD')
})

test('POST / password with length < 7', async t => {
    const res = await request.post(config.api.reset, {
        "password": "123456",
        "token": "TEST_TOKEN"
    })

    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'RESET_INVALID_PASSWORD')
})

test('POST / invalid token', async t => {
    const res = await request.post(config.api.reset, {
        "password": "123456789",
        "token": faker.random.uuid
    })
    
    t.deepEqual(res.statusCode, 400)
    t.deepEqual(res.body.message, 'COULD_NOT_CHANGE_PASSWORD_TOKEN_EXPIRED')
})