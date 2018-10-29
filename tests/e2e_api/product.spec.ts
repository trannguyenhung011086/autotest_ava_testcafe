import config from '../../config/config'
import { Utils } from '../../common'
let request = new Utils()

describe('Product API', () => {
    test('GET / product info - wrong product ID', async () => {
        let response = await request.get(config.api.product + '5b0fd3bf1e73c50001f6fcee')
        expect(response.status).toEqual(500)
        expect(response.data.message).toEqual('COULD_NOT_LOAD_PRODUCT')
    })

    test('GET / product info - sale ended', async () => {
        let response = await request.get(config.api.product + '5b0fd3bf1e73c50001f6fced')
        expect(response.status).toEqual(410)
        expect(response.data.message).toEqual('SALE_HAS_ENDED')
    })
})