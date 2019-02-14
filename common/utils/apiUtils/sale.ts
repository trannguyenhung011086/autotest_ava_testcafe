import { config } from '../../../config'
import * as Model from '../../interface'
import { Helper } from '../helper'

export class SaleUtils extends Helper {
    constructor() {
        super()
    }

    public async getSales(saleType: string): Promise<Model.SalesModel[]> {
        const res = await this.get(saleType)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get sales from ' + saleType,
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async getUpcomingSales(): Promise<Model.UpcomingSalesModel[]> {
        const res = await this.get(config.api.upcomingSales)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get upcoming sales!',
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }

    public async getSaleInfo(saleId: string): Promise<Model.SaleInfoModel> {
        const res = await this.get(config.api.sales + saleId)
        if (res.statusCode != 200) {
            throw {
                message: 'Cannot get info from sale: ' + saleId,
                error: JSON.stringify(res.body, null, '\t')
            }
        }
        return res.body
    }
}