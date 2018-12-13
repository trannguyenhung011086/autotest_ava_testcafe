import config from '../../config/config'
import * as Model from '../interface'
import { MongoClient } from 'mongodb'

export default class MongoUtils {
    public async getDbData(collectionName: string, query: Object): Promise<any> {
        let client: MongoClient
        try {
            client = await MongoClient.connect(config.stagingDb.uri, { useNewUrlParser: true })
            const db = client.db(config.stagingDb.name)
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
            client = await MongoClient.connect(config.stagingDb.uri, { useNewUrlParser: true })
            const db = client.db(config.stagingDb.name)
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
            client = await MongoClient.connect(config.stagingDb.uri, { useNewUrlParser: true })
            const db = client.db(config.stagingDb.name)
            const collection = db.collection(collectionName)
            return await collection.countDocuments(query)
        } catch (err) {
            throw { message: 'Error with database!', error: err }
        } finally {
            await client.close()
        }
    }

    public async getCustomerInfo(query: Object) {
        return await this.getDbData('customers', query)
    }

    public async getVoucher(query: Object): Promise<Model.VoucherModel> {
        return await this.getDbData('vouchers', query)
    }

    public async getVoucherList(query: Object): Promise<Model.VoucherModel[]> {
        return await this.getDbDataList('vouchers', query)
    }

    public async getGiftCard(query: Object): Promise<Model.GiftcardModel> {
        return await this.getDbData('giftcards', query)
    }

    public async getSale(query: Object): Promise<Model.SaleInfoModel> {
        return await this.getDbData('sales', query)
    }

    public async getSaleList(query: Object): Promise<Model.SaleInfoModel[]> {
        return await this.getDbDataList('sales', query)
    }

    public async getProduct(query: Object): Promise<Model.ProductInfoModel> {
        return await this.getDbData('products', query)
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
        for (let voucher of vouchers) {
            const checkUsed = await this.checkUsedVoucher(voucher._id, customer._id)
            if (checkUsed) {
                return voucher
            }
        }
    }

    public async getNotUsedVoucher(query: Object, customer: Model.Customer): Promise<Model.VoucherModel> {
        let vouchers = await this.getVoucherList(query)
        for (let voucher of vouchers) {
            const checkUsed = await this.checkUsedVoucher(voucher._id, customer._id)
            if (!checkUsed) {
                return voucher
            }
        }
    }
}