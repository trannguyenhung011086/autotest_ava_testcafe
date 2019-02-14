import { config } from '../../../config'
import * as Model from '../../interface'
import { MongoClient } from 'mongodb'

export class DbAccessUtils {
    public async getDbData(collectionName: string, query: Object): Promise<any> {
        let client: MongoClient
        try {
            client = await MongoClient.connect(config.stgDb.uri, { useNewUrlParser: true })
            const db = client.db(config.stgDb.name)
            const collection = db.collection(collectionName)
            return await collection.findOne(query)
        } catch (err) {
            throw { message: 'Error with database!', error: err }
        } finally {
            await client.close()
        }
    }

    public async getDbDataList(collectionName: string, query: Object): Promise<any[]> {
        let client: MongoClient
        try {
            client = await MongoClient.connect(config.stgDb.uri, { useNewUrlParser: true })
            const db = client.db(config.stgDb.name)
            const collection = db.collection(collectionName)
            const result = await collection.find(query).limit(20)
            return result.toArray()
        } catch (err) {
            throw { message: 'Error with database!', error: err }
        } finally {
            await client.close()
        }
    }

    public async countDbData(collectionName: string, query: Object): Promise<number> {
        let client: MongoClient
        try {
            client = await MongoClient.connect(config.stgDb.uri, { useNewUrlParser: true })
            const db = client.db(config.stgDb.name)
            const collection = db.collection(collectionName)
            return await collection.countDocuments(query)
        } catch (err) {
            throw { message: 'Error with database!', error: err }
        } finally {
            await client.close()
        }
    }

    public async getCustomerInfo(query: Object) {
        let info = await this.getDbData('customers', query)
        if (!info) {
            throw 'Cannot get customer info!'
        }
        return info
    }

    public async getVoucher(query: Object): Promise<Model.VoucherModel> {
        let voucher = await this.getDbData('vouchers', query)
        if (!voucher) {
            throw 'Cannot get voucher!'
        }
        return voucher
    }

    public async getVoucherList(query: Object): Promise<Model.VoucherModel[]> {
        let vouchers = await this.getDbDataList('vouchers', query)
        if (!vouchers) {
            throw 'Cannot get voucher list!'
        }
        return vouchers
    }

    public async getGiftCard(query: Object): Promise<Model.GiftcardModel> {
        let card = await this.getDbData('giftcards', query)
        if (!card) {
            throw 'Cannot get gift card!'
        }
        return card
    }

    public async getSale(query: Object): Promise<Model.SaleInfoModel> {
        let sale = await this.getDbData('sales', query)
        if (!sale) {
            throw 'Cannot get sale!'
        }
        return sale
    }

    public async getSaleList(query: Object): Promise<Model.SaleInfoModel[]> {
        let sales = await this.getDbDataList('sales', query)
        if (!sales) {
            throw 'Cannot get sale list!'
        }
        return sales
    }

    public async getProduct(query: Object): Promise<Model.ProductInfoModel> {
        let product = await this.getDbData('products', query)
        if (!product) {
            throw 'Cannot get product!'
        }
        return product
    }

    public async countUsedVoucher(voucherId: Object): Promise<number> {
        return await this.countDbData('orders', {
            'paymentSummary.voucher': voucherId,
            status: {
                $nin: ['rejected',
                    'rejection accepted',
                    'returned',
                    'cancelled',
                    'failed',
                    'failed attempt']
            }
        })
    }

    public async checkUsedVoucher(voucherId: string, userId: string): Promise<boolean> {
        const count = await this.countDbData('orders', {
            'paymentSummary.voucher': voucherId,
            user: userId,
            status: {
                $nin: ['rejected',
                    'rejection accepted',
                    'returned',
                    'cancelled',
                    'failed',
                    'failed attempt']
            }
        })
        return !!count
    }

    public async getUsedVoucher(query: Object, customer: Model.Customer): Promise<Model.VoucherModel> {
        let vouchers = await this.getVoucherList(query)

        let result: Model.VoucherModel
        for (let voucher of vouchers) {
            const checkUsed = await this.checkUsedVoucher(voucher._id, customer._id)
            if (checkUsed) {
                result = voucher
                break
            }
        }

        if (!result) {
            throw 'Cannot get voucher!'
        }
        return result
    }

    public async getNotUsedVoucher(query: Object, customer: Model.Customer): Promise<Model.VoucherModel> {
        let vouchers = await this.getVoucherList(query)

        let result: Model.VoucherModel
        for (let voucher of vouchers) {
            const checkUsed = await this.checkUsedVoucher(voucher._id, customer._id)
            if (!checkUsed) {
                result = voucher
                break
            }
        }

        if (!result) {
            throw 'Cannot get voucher!'
        }
        return result
    }

    public async getCampaign(query: Object): Promise<Model.Campaign> {
        let campaign = await this.getDbData('campaigns', query)
        if (!campaign) {
            throw 'Cannot get campaign!'
        }
        return campaign
    }
}