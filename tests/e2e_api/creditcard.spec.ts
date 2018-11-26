import config from '../../config/config'
import { Utils } from '../../common'
import 'jest-extended'
let request = new Utils()
import * as model from '../../common/interface'
let cookie: string
let creditcards: model.CreditCard[]
import waitForExpect from 'wait-for-expect'

describe('Creditcard info API ' + config.baseUrl + config.api.creditcard, () => {
    beforeAll(async () => {
        cookie = await request.getLogInCookie()
    })

    test('GET / can access creditcard info', async () => {
        let response = await request.get(config.api.creditcard, cookie)
        creditcards = response.data
        expect(response.status).toEqual(200)
        for (let card of creditcards) {
            expect(card.cardholderName).not.toBeEmpty()
            expect(card.id).not.toBeEmpty()
            expect(card.lastDigits).toMatch(/\d{4}/)
            expect(card.type.toLowerCase()).toMatch(/visa|master/)
            if (card.provider) {
                expect(card.provider).toEqual('STRIPE')
            }
        }
    })

    test('DELETE / can delete creditcard', async () => {
        let response = await request.get(config.api.creditcard, cookie)
        creditcards = response.data
        if (creditcards.length > 0) {
            response = await request.delete(config.api.creditcard + '/' + creditcards[0].id)
            await waitForExpect(() => {
                expect(response.status).toEqual(200)
                expect(response.data).toBeTrue()
            })
        }
    })

    test('DELETE / cannot delete invalid creditcard', async () => {
        let response = await request.get(config.api.creditcard, cookie)
        creditcards = response.data
        response = await request.delete(config.api.creditcard + '/INVALID-ID')
        await waitForExpect(() => {
            expect(response.status).toEqual(500)
            expect(response.data.message).toEqual('INVALID_CREDIT_CARD_OR_CANNOT_DELETE')
        })
    })

    test('GET / cannot access creditcard info with invalid cookie', async () => {
        let response = await request.get(config.api.creditcard, cookie = 'abc')
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })

    test('GET / cannot access creditcard info without login', async () => {
        let response = await request.get(config.api.creditcard)
        expect(response.status).toEqual(401)
        expect(response.data.message).toEqual('Access denied.')
    })
})