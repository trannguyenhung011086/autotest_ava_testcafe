import { config } from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"

export const NewsSubscribeTest = () => {
    it('POST / empty email', async () => {
        let response = await request.post(config.api.subscribe, { "email": "" })
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('done')
    })

    it('POST / wrong format email', async () => {
        let response = await request.post(config.api.subscribe, { "email": ".test%!@#$%^&*()_+<>?@mail.com" })
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('done')
    })

    it('POST / valid email', async () => {
        let response = await request.post(config.api.subscribe, { "email": faker.internet.email() })
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('done')
    })
}

describe('News subscribe API ' + config.baseUrl + config.api.subscribe, NewsSubscribeTest)