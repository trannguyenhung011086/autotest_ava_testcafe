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
            throw err
        } finally {
            await client.close()
        }
    }

    public async getVoucher(query: Object): Promise<Model.VoucherModel> {
        return await this.getDbData('vouchers', query)
    }

    public async getGiftCard(query: Object): Promise<Model.GiftcardModel> {
        return await this.getDbData('giftcards', query)
    }

    public async getEndedSale(query: Object): Promise<Model.SaleInfoModel> {
        return await this.getDbData('sales', query)
    }

    public async getProduct(query: Object): Promise<Model.ProductInfoModel> {
        return await this.getDbData('products', query)
    }
}