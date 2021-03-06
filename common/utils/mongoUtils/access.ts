import { config } from "../../config";
import * as Model from "../../interface";
import { MongoClient } from "mongodb";

export class DbAccessUtils {
    public async getDbData(
        collectionName: string,
        query: Object
    ): Promise<any> {
        let client: MongoClient;
        try {
            client = await MongoClient.connect(config.mongo.uri, {
                useNewUrlParser: true
            });
            const db = client.db(config.mongo.name);
            const collection = db.collection(collectionName);
            return await collection.findOne(query);
        } catch (err) {
            throw { message: "Error with database!", error: err };
        } finally {
            await client.close();
        }
    }

    public async getDbDataList(
        collectionName: string,
        query: Object
    ): Promise<any[]> {
        let client: MongoClient;
        try {
            client = await MongoClient.connect(config.mongo.uri, {
                useNewUrlParser: true
            });
            const db = client.db(config.mongo.name);
            const collection = db.collection(collectionName);
            const result = await collection.find(query).limit(20);
            return result.toArray();
        } catch (err) {
            throw { message: "Error with database!", error: err };
        } finally {
            await client.close();
        }
    }

    public async countDbData(
        collectionName: string,
        query: Object
    ): Promise<number> {
        let client: MongoClient;
        try {
            client = await MongoClient.connect(config.mongo.uri, {
                useNewUrlParser: true
            });
            const db = client.db(config.mongo.name);
            const collection = db.collection(collectionName);
            return await collection.countDocuments(query);
        } catch (err) {
            throw { message: "Error with database!", error: err };
        } finally {
            await client.close();
        }
    }

    public async updateDbData(
        collectionName: string,
        query: Object,
        update: Object
    ) {
        let client: MongoClient;
        try {
            client = await MongoClient.connect(config.mongo.uri, {
                useNewUrlParser: true
            });
            const db = client.db(config.mongo.name);
            const collection = db.collection(collectionName);
            return collection.updateOne(query, {
                $set: update
            });
        } catch (err) {
            throw { message: "Error with database!", error: err };
        } finally {
            await client.close();
        }
    }

    public async getCustomerInfo(query: Object) {
        const info = await this.getDbData("customers", query);
        if (!info) {
            throw "Cannot get customer info!";
        }
        return info;
    }

    public async getVoucher(query: Object): Promise<Model.VoucherModel> {
        return await this.getDbData("vouchers", query);
    }

    public async getVoucherList(query: Object): Promise<Model.VoucherModel[]> {
        const vouchers = await this.getDbDataList("vouchers", query);
        if (!vouchers) {
            throw "Cannot get voucher list!";
        }
        return vouchers;
    }

    public async getGiftCard(query: Object): Promise<Model.GiftcardModel> {
        const card = await this.getDbData("giftcards", query);
        if (!card) {
            throw "Cannot get gift card!";
        }
        return card;
    }

    public async getSale(query: Object): Promise<Model.SaleInfoModel> {
        return await this.getDbData("sales", query);
    }

    public async getSaleList(query: Object): Promise<Model.SaleInfoModel[]> {
        const sales = await this.getDbDataList("sales", query);
        if (!sales) {
            throw "Cannot get sale list!";
        }
        return sales;
    }

    public async getProduct(query: Object): Promise<Model.ProductInfoModel> {
        return await this.getDbData("products", query);
    }

    public async countUsedVoucher(voucherId: Object): Promise<number> {
        return await this.countDbData("orders", {
            "paymentSummary.voucher": voucherId,
            status: {
                $nin: [
                    "rejected",
                    "rejection accepted",
                    "returned",
                    "cancelled",
                    "failed",
                    "failed attempt"
                ]
            }
        });
    }

    public async getOrderUsedVoucher(voucherId: Object): Promise<any> {
        return await this.getDbData("orders", {
            "paymentSummary.voucher": voucherId,
            status: {
                $nin: [
                    "rejected",
                    "rejection accepted",
                    "returned",
                    "cancelled",
                    "failed",
                    "failed attempt"
                ]
            }
        });
    }

    public async checkUsedVoucher(
        voucherId: string,
        userId: string
    ): Promise<boolean> {
        const count = await this.countDbData("orders", {
            "paymentSummary.voucher": voucherId,
            user: userId,
            status: {
                $nin: [
                    "rejected",
                    "rejection accepted",
                    "returned",
                    "cancelled",
                    "failed",
                    "failed attempt"
                ]
            }
        });
        return !!count;
    }

    public async getUsedVoucher(
        query: Object,
        customer: Model.Customer
    ): Promise<Model.VoucherModel> {
        const vouchers = await this.getVoucherList(query);

        for (const voucher of vouchers) {
            const checkUsed = await this.checkUsedVoucher(
                voucher._id,
                customer._id
            );
            if (checkUsed) {
                return voucher;
            }
        }
    }

    public async getNotUsedVoucher(
        query: Object,
        customer: Model.Customer
    ): Promise<Model.VoucherModel> {
        const vouchers = await this.getVoucherList(query);

        for (const voucher of vouchers) {
            const checkUsed = await this.checkUsedVoucher(
                voucher._id,
                customer._id
            );
            if (!checkUsed) {
                return voucher;
            }
        }
    }

    public async getCampaign(query: Object): Promise<Model.Campaign> {
        return await this.getDbData("campaigns", query);
    }

    public async updateOrderStatus(orderCode: string, status: string) {
        const res = await this.updateDbData(
            "orders",
            { code: orderCode },
            { status: status }
        );

        if (res.result.nModified == 0) {
            throw "Cannot update order status!";
        }
        return res.result;
    }
}
