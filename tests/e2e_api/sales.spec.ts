import config from '../../config/config'
import { Utils } from '../../common'
let request = new Utils()

describe('Sales API '  + config.baseUrl + config.api.sales + '/<saleID>', () => {
    test('GET / sales info - wrong sale ID', async () => {
        let response = await request.get(config.api.sales + 'invalid-5bd6c3137cf0476b22488d2')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('INVALID_SALE_ID')
    })

    test('GET / sales info - no sale matching', async () => {
        let response = await request.get(config.api.sales + 'invalid-5bd6c3137cf0476b22488d21')
        expect(response.status).toEqual(404)
        expect(response.data.message).toEqual('NO_SALE_MATCHING')
    })
})