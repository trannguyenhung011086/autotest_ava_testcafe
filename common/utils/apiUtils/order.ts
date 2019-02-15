import { config } from '../../config'
import * as Model from '../../interface'
import { Helper } from '../helper'

export class OrderUtils extends Helper {
    constructor() {
        super()
    }

    public async getOrders(cookie?: string): Promise<Model.OrderSummary[]> {
        try {
            let res = await this.get(config.api.orders, cookie)
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get order list!',
                error: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async getOrderInfo(orderId: string, cookie?: string): Promise<Model.Order> {
        try {
            let res = await this.get(config.api.orders + '/' + orderId, cookie)
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get order info of ' + orderId,
                error: JSON.stringify(e, null, '\t')
            }
        }
    }

    public async getSplitOrderInfo(orderCode: string, cookie?: string): Promise<Model.Order[]> {
        try {
            let res = await this.get(config.api.orders + '/' + orderCode, cookie)
            return res.body
        } catch (e) {
            throw {
                message: 'Cannot get order info of ' + orderCode,
                error: JSON.stringify(e, null, '\t')
            }
        }
    }
}