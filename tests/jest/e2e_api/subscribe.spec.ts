import { config } from '../../../common/config'
import * as Utils from '../../../common/utils'
import faker from 'faker/locale/vi'

let helper = new Utils.Helper

export const NewsSubscribeTest = () => {
    it('POST / empty email', async () => {
        let res = await helper.post(config.api.subscribe, {
            "email": ""
        })
        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('done')
    })

    it('POST / wrong format email', async () => {
        let res = await helper.post(config.api.subscribe, {
            "email": ".test%!@#$%^&*()_+<>?@mail.com"
        })
        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('done')
    })

    it('POST / valid email', async () => {
        let res = await helper.post(config.api.subscribe, {
            "email": faker.internet.email()
        })
        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('done')
    })
}

describe('News subscribe API ' + config.baseUrl + config.api.subscribe, NewsSubscribeTest)