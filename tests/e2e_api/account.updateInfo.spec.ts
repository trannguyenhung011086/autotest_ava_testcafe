import config from '../../config/config'
import { Utils } from '../../common'
let request = new Utils()
import * as faker from 'faker'

describe('Update info API '  + config.baseUrl + config.api.account, () => {
    var cookie: string
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    test('PUT / can change name', async () => {
        let response = await request.put(config.api.account,
            { "firstName": "first", "lastName": "last" },
            cookie)
        expect(response.status).toEqual(200)
        expect(response.data.firstName).toEqual('first')
        expect(response.data.lastName).toEqual('last')
    })

    test('PUT / cannot change to another existing email', async () => {
        let response = await request.put(config.api.account,
            { "email": config.testAccount.facebook },
            cookie)
        expect(response.status).toEqual(400)
        expect(response.data.message).toEqual('USER_UPDATE_ERROR')
    })

    test('PUT / wrong cookie access denied', async () => {
        let response = await request.put(config.api.account,
            { "firstName": "first", "lastName": "last" },
            cookie='assdfds')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
})