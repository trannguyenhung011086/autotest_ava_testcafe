import { config } from '../../config'
import * as Model from '../../interface'
import { Helper } from '../helper'
import { AccountUtils } from './account'
import { AddressUtils } from './address'
import { CartUtils } from './cart'

export class CheckoutUtils extends Helper {
    constructor() {
        super()
    }

    public async checkoutPayDollar(info: Model.CheckoutInput, cookie?: string): Promise<Model.CheckoutOrder> {
        let data = {
            "address": {
                "shipping": info.addresses.shipping[0],
                "billing": info.addresses.billing[0]
            },
            "cart": info.account.cart,
            "method": "CC",
            "shipping": 0
        }
        if (info.saveNewCard) {
            data['saveCard'] = info.saveNewCard
        }
        if (info.voucherId) {
            data['voucher'] = info.voucherId
        }
        if (info.credit) {
            data['accountCredit'] = info.credit
        }
        if (info.methodData) {
            data['methodData'] = info.methodData
        }
        if (info.cart) {
            data['cart'] = info.cart
        }

        let api: string
        if (info.orderCode) {
            api = config.api.checkout + '/order/' + info.orderCode
        } else {
            api = config.api.checkout
        }

        const res = await this.post(api, data, cookie)
        return res.body
    }

    public async parsePayDollarRes(content: string): Promise<Model.PayDollarResponse> {
        let result: any = content.split('&').reduce((result, value) => {
            result[value.split('=')[0]] = value.split('=')[1]
            return result
        }, {})

        return result
    }

    public async checkoutCod(info: Model.CheckoutInput, cookie?: string): Promise<Model.CheckoutOrder> {
        let data = {
            "address": {
                "shipping": info.addresses.shipping[0],
                "billing": info.addresses.billing[0]
            },
            "cart": info.account.cart,
            "method": "COD",
            "shipping": 25000
        }
        if (info.voucherId) {
            data['voucher'] = info.voucherId
        }
        if (info.credit) {
            data['accountCredit'] = info.credit
        }
        if (info.cart) {
            data['cart'] = info.cart
        }

        let api: string
        if (info.orderCode) {
            api = config.api.checkout + '/order/' + info.orderCode
        } else {
            api = config.api.checkout
        }

        const res = await this.post(api, data, cookie)
        return res.body
    }

    public async checkoutStripe(info: Model.CheckoutInput, cookie?: string): Promise<Model.CheckoutOrder> {
        let data = {
            "address": {
                "shipping": info.addresses.shipping[0],
                "billing": info.addresses.billing[0]
            },
            "cart": info.account.cart,
            "method": "STRIPE",
            "methodData": info.stripeSource,
            "shipping": 0
        }
        if (info.saveNewCard) {
            data['saveCard'] = info.saveNewCard
        }
        if (info.voucherId) {
            data['voucher'] = info.voucherId
        }
        if (info.credit) {
            data['accountCredit'] = info.credit
        }
        if (info.methodData) {
            data['methodData'] = info.methodData
        }
        if (info.cart) {
            data['cart'] = info.cart
        }

        let api: string
        if (info.orderCode) {
            api = config.api.checkout + '/order/' + info.orderCode
        } else {
            api = config.api.checkout
        }

        const res = await this.post(api, data, cookie)
        return res.body
    }

    public async failedAttempt(orderCode: string, cookie?: string): Promise<Model.FailedAttempt> {
        const res = await this.post(config.api.checkout + '/order/failed-attempt', {
            "errorMsg": "invalid card",
            "orderCode": orderCode
        }, cookie)

        return res.body
    }

    public async createFailedAttemptOrder(items: Model.Product[], cookie?: string): Promise<Model.FailedAttempt> {
        for (let item of items) {
            await new CartUtils().addToCart(item.id, cookie)
        }

        let info: Model.CheckoutInput
        info = {}
        info.account = await new AccountUtils().getAccountInfo(cookie)
        info.addresses = await new AddressUtils().getAddresses(cookie)

        let checkout = await this.checkoutPayDollar(info, cookie)

        let payDollarCreditCard = checkout.creditCard
        payDollarCreditCard.cardHolder = 'testing card'
        payDollarCreditCard.cardNo = '4111111111111111'
        payDollarCreditCard.pMethod = 'VISA'
        payDollarCreditCard.epMonth = 7
        payDollarCreditCard.epYear = 2020
        payDollarCreditCard.securityCode = '123'

        const res = await this.postFormUrlPlain(config.payDollarApi, payDollarCreditCard,
            cookie, config.payDollarBase)

        let parse = await this.parsePayDollarRes(res.body)

        if (parse.successcode != '1') {
            throw 'Cannot create failed-attempt order!'
        }

        let failedAttempt = await this.failedAttempt(parse.Ref, cookie)
        return failedAttempt
    }
}