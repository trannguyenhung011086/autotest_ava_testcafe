import config from '../../../config'
import * as Utils from '../../../common/utils'
let request = new Utils.ApiUtils()
import 'jest-extended'
import faker from "faker/locale/vi"

describe('News subscribe API ' + config.baseUrl + config.api.subscribe, () => {
    it('POST / empty email', async () => {
        let response = await request.post(config.api.subscribe, { "email": "" })
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('done')
    }) // need to confirm

    it('POST / wrong format email', async () => {
        let response = await request.post(config.api.subscribe, { "email": ".test%!@#$%^&*()_+<>?@mail.com" })
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('done')
    }) // need to confirm

    it('POST / valid email', async () => {
        let response = await request.post(config.api.subscribe, { "email": faker.internet.email() })
        expect(response.status).toEqual(200)
        expect(response.data.message).toEqual('done')
    })
})