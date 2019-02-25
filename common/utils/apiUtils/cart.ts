import { config } from '../../config'
import * as Model from '../../interface'
import { Helper } from '../helper'
import { AccountUtils } from '../apiUtils/account'

export class CartUtils extends Helper {
    constructor() {
        super()
    }

    public async emptyCart(cookie?: string) {
        let account = await new AccountUtils().getAccountInfo(cookie)
        let deletedList = []

        if (account.cart.length > 0) {
            for (let item of account.cart) {
                deletedList.push(item.id)
            }

            let res = await this.put(config.api.cart + 'delete-multiple',
                { "cartItemIds": deletedList }, cookie)

            if (res.statusCode != 200) {
                throw {
                    message: 'Cannot remove from cart!',
                    error: JSON.stringify(res.body, null, '\t')
                }
            }
            return res.body
        }
    }

    public async addToCart(productId: string, cookie?: string, check?: boolean): Promise<Model.Cart> {
        let res = await this.post(config.api.cart, {
            "productId": productId
        }, cookie)

        if (check && res.statusCode != 200) {
            throw {
                message: 'Cannot add to cart: ' + productId,
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async updateQuantityCart(cartId: string, quantity: number, cookie?: string): Promise<Model.Cart> {
        let res = await this.put(config.api.cart + cartId, {
            "quantity": quantity
        }, cookie)

        if (res.statusCode != 200) {
            throw {
                message: 'Cannot update quantity: ' + cartId,
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }
}