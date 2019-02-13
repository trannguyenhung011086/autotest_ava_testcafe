import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"

export const NewsSubscribeTest = () => {
    it('POST / empty email', async () => {
        let res = await request.post(config.api.subscribe, {
            "email": ""
        })
        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('done')
    })

    it('POST / wrong format email', async () => {
        let res = await request.post(config.api.subscribe, {
            "email": ".test%!@#$%^&*()_+<>?@mail.com"
        })
        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('done')
    })

    it('POST / valid email', async () => {
        let res = await request.post(config.api.subscribe, {
            "email": faker.internet.email()
        })
        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('done')
    })
}

describe('News subscribe API ' + config.baseUrl + config.api.subscribe, NewsSubscribeTest)