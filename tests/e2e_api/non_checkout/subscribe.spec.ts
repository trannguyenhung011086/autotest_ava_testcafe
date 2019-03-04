import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import * as faker from 'faker/locale/vi'

let helper = new Utils.Helper

import test from 'ava'

test('POST / empty email', async t => {
    const res = await helper.post(config.api.subscribe, {
        "email": ""
    })

    if (process.env.NODE_ENV == 'prod') {
        t.deepEqual(res.statusCode, 200)
        t.deepEqual(res.body.message, 'done')
    } else {
        t.deepEqual(res.statusCode, 400)
        t.deepEqual(res.body.message, 'fail')
    }
})

test('POST / wrong format email', async t => {
    const res = await helper.post(config.api.subscribe, {
        "email": ".test%!@#$%^&*()_+<>?@mail.com"
    })

    if (process.env.NODE_ENV == 'prod') {
        t.deepEqual(res.statusCode, 200)
        t.deepEqual(res.body.message, 'done')
    } else {
        t.deepEqual(res.statusCode, 400)
        t.deepEqual(res.body.message, 'fail')
    }
})

test('POST / valid email', async t => {
    const res = await helper.post(config.api.subscribe, {
        "email": faker.internet.email()
    })

    if (process.env.NODE_ENV == 'prod') {
        t.deepEqual(res.statusCode, 200)
        t.deepEqual(res.body.message, 'done')
    } else {
        t.deepEqual(res.statusCode, 400)
        t.deepEqual(res.body.message, 'fail')
    }
})