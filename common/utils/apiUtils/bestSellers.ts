import { config } from '../../config'
import * as Model from '../../interface'
import { Helper } from '../helper'

export class BestSellersUtils extends Helper {
    constructor() {
        super()
    }

    public async getBestSellers(): Promise<Model.BestSellers[]> {
        const res = await this.get(config.api.bestSellers)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get bestsellers!',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }
}