import { config } from '../config'
import * as got from 'got'
import { GotJSONOptions } from 'got'
import { CookieJar } from 'tough-cookie'
import { ExecutionContext } from 'ava'
import * as Model from '../interface'

export class Helper {
    public cookieJar = new CookieJar()

    public async get(api: string, cookie?: string, base?: string) {
        let options: GotJSONOptions = {
            baseUrl: config.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
            throwHttpErrors: false,
            // cookieJar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        if (base) {
            options.baseUrl = base
        }
        return await got.get(api, options)
    }

    public async getPlain(api: string, cookie?: string, base?: string) {
        let options = {
            baseUrl: config.baseUrl,
            headers: {
                'Content-Type': 'text/plain'
            },
            throwHttpErrors: false,
            // cookieJar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        if (base) {
            options.baseUrl = base
        }
        return await got.get(api, options)
    }

    public async post(api: string, data: Object, cookie?: string, base?: string) {
        let options: GotJSONOptions = {
            baseUrl: config.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            body: data,
            json: true,
            throwHttpErrors: false,
            // cookieJar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        if (base) {
            options.baseUrl = base
        }
        return await got.post(api, options)
    }

    public async put(api: string, data: Object, cookie?: string, base?: string) {
        let options: GotJSONOptions = {
            baseUrl: config.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            body: data,
            json: true,
            throwHttpErrors: false,
            // cookieJar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        if (base) {
            options.baseUrl = base
        }
        return await got.put(api, options)
    }

    public async postFormUrl(api: string, data: any, cookie?: string, base?: string) {
        let options: GotJSONOptions = {
            baseUrl: config.baseUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data,
            throwHttpErrors: false,
            json: true,
            form: true,
            followRedirect: false,
            // cookieJar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        if (base) {
            options.baseUrl = base
        }
        return await got.post(api, options)
    }

    public async postFormUrlPlain(api: string, data: any, cookie?: string, base?: string) {
        let options = {
            baseUrl: config.baseUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data,
            throwHttpErrors: false,
            form: true,
            followRedirect: false,
            // cookieJar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        if (base) {
            options.baseUrl = base
        }
        return await got.post(api, options)
    }

    public async delete(api: string, cookie?: string, base?: string) {
        let options: GotJSONOptions = {
            baseUrl: config.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
            throwHttpErrors: false,
            // cookieJar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        if (base) {
            options.baseUrl = base
        }
        return await got.delete(api, options)
    }

    public async getLogInCookie(email: string, password: string): Promise<string> {
        const data: Object = {
            email: email,
            password: password
        }

        let cookie = await this.post(config.api.signIn, data)
            .then(res => res.headers['set-cookie'][0])

        if (!cookie) {
            throw 'Cannot get login cookie!'
        }
        return cookie
    }

    public async getGuestCookie(): Promise<string> {
        let cookie = await this.get(config.api.account)
            .then(res => res.headers['set-cookie'][0])

        if (!cookie) {
            throw 'Cannot get guest cookie!'
        }
        return cookie
    }

    public async pickRandomUser(emailList: string[]) {
        const rand = Math.floor(Math.random() * emailList.length)
        return await this.getLogInCookie(config.testAccount.email_ex[rand],
            config.testAccount.password_ex)
    }

    public getArrayRandomElement(arr: any[]) {
        if (arr && arr.length) {
            return arr[Math.floor(Math.random() * arr.length)]
        }
    }

    public matchRegExp(input: string, exp: RegExp) {
        if (input.match(exp) && input.match(exp).length > 0) {
            return true
        }
        return false
    }

    public validateEmail(email: string) {
        return this.matchRegExp(email.toLowerCase(), /(?=^.{1,64}$)^[a-zA-Z0-9](?:[a-zA-Z0-9\._-]*[a-zA-Z0-9])?@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-z]{2,}))$/)
    }

    public validateImage(image: string) {
        return this.matchRegExp(image.toLowerCase(), /\.jpg|\.png|\.jpeg|\.jpe/)
    }

    public validateDate(date: string) {
        return this.matchRegExp(date, /^(\d\d\/){2}\d{4}$/)
    }

    public calculateCredit(accountCredit: number, salePrice: number, voucher: number) {
        let credit: number
        const discount = salePrice - voucher

        if (accountCredit >= discount) {
            credit = discount
        } else {
            credit = accountCredit
        }
        return credit
    }

    public validateOrderSummary(t: ExecutionContext, order: Model.OrderSummary) {
        if (order.code) {
            t.regex(order.code, /^SG|HK|VN/)
        }

        t.regex(order.status, /pending|placed|confirmed|cancelled|shipped|delivered|return request|returned/)

        t.true(this.validateDate(order.createdDate))

        if (order.shippedDate) {
            t.true(this.validateDate(order.shippedDate))
        }
        if (order.deliveredDate) {
            t.true(this.validateDate(order.deliveredDate))
        }
    }

    public validateAddress(t: ExecutionContext, address: any) {
        t.truthy(address.address)
        t.truthy(address.city)
        t.truthy(address.district)
        t.truthy(address.firstName)
        t.truthy(address.lastName)
        t.truthy(address.phone)
    }

    public validatePayment(t: ExecutionContext, payment: Model.PaymentSummary) {
        t.regex(payment.method, /COD|STRIPE|CC|FREE/)

        if (payment.method == 'COD' || payment.method == 'STRIPE') {
            t.falsy(payment.card)
        }
        if (payment.card) {
            t.regex(payment.card.lastDigits, /\d{4}/)
            t.regex(payment.card.type, /VISA|Master/)
        }

        t.true(payment.shipping <= 25000)
        t.true(payment.subtotal >= 0)
        t.true(payment.accountCredit <= 0)
        t.true(payment.voucherAmount >= 0)
        t.true(payment.total >= 0)
    }

    public validateProduct(t: ExecutionContext, product: Model.OrderedProduct) {
        t.truthy(product.id)
        t.truthy(product.productContentId)
        t.truthy(product.title)
        t.true(product.slug.includes(product.productContentId))
        t.true.skip(product.retailPrice >= product.salePrice)
        t.true(product.salePrice <= product.totalSalePrice)
        t.true(product.quantity > 0)
        t.true(this.validateImage(product.image))
        t.deepEqual(typeof (product.returnable), 'boolean')
        t.truthy(product.type)
        t.truthy(product.brand._id)
        t.truthy(product.brand.name)
        t.truthy(product.nsId)
        t.truthy(product.productId)
    }

    public validateOrderDetail(t: ExecutionContext, orderItem: Model.Order) {
        this.validateOrderSummary(t, orderItem)

        t.truthy(orderItem.id)
        t.truthy(orderItem.createdTimestamp)

        t.deepEqual(typeof (orderItem.isCrossBorder), 'boolean')
        t.deepEqual(typeof (orderItem.isBulky), 'boolean')
        t.deepEqual(typeof (orderItem.isFirstOrder), 'boolean')
        t.deepEqual(typeof (orderItem.isVirtual), 'boolean')

        t.regex(orderItem.tracking, /dhlecommerce\.asia|ghn\.vn/)
        t.truthy(orderItem.user)

        this.validateAddress(t, orderItem.address.billing)
        this.validateAddress(t, orderItem.address.shipping)
        this.validatePayment(t, orderItem.paymentSummary)

        orderItem.products.forEach(product => {
            this.validateProduct(t, product)
        })
    }

    public validateCategory(t: ExecutionContext, menu: Model.CategoryMenu) {
        t.truthy(menu.id)
        t.deepEqual(menu.name, '')
        t.truthy(menu.displayName.vn)
        t.truthy(menu.displayName.en)
        t.deepEqual(menu.type, 'categories')

        menu.subitems.forEach(item => {
            t.truthy(item.id)
            t.deepEqual(item.name, '')
            t.truthy(item.displayName.vn)
            t.truthy(item.displayName.en)
            t.true(item.salesCount >= 0)
            t.true(item.slug.vn.includes(item.id))
            t.true(item.slug.en.includes(item.id))
        })

        t.truthy(menu.parent.id)
        t.truthy(menu.parent.displayName.vn)
        t.truthy(menu.parent.displayName.en)
        t.true(menu.slug.vn.includes(menu.id))
        t.true(menu.slug.en.includes(menu.id))
    }

    public validateSale(t: ExecutionContext, sale: Model.SalesModel) {
        t.truthy(sale.id)
        t.truthy(sale.title)
        t.truthy(sale.endTime)
        t.true(this.validateImage(sale.image1))
        t.deepEqual(typeof (sale.international), 'boolean')

        if (sale.potd === false) {
            t.true(sale.slug.includes(sale.id))
        } else if (sale.potd === true) {
            t.false(sale.slug.includes(sale.id))
        }
    }

    public validateProductItem(t: ExecutionContext, product: Model.Product) {
        t.truthy(product.id)
        t.truthy(product.nsId)
        t.truthy(product.saleId)
        t.true(product.retailPrice >= product.salePrice)
        t.deepEqual(typeof (product.inStock), 'boolean')
        t.true.skip(product.quantity >= 0)
        t.deepEqual(typeof (product.isVirtual), 'boolean')
        t.deepEqual(typeof (product.isBulky), 'boolean')
    }

    public validateProductInfo(t: ExecutionContext, info: Model.ProductInfoModel) {
        t.truthy(info.id)
        t.truthy(info.sale.slug)
        t.true(new Date(info.sale.startTime).getTime() < new Date(info.sale.endTime).getTime())
        t.truthy(info.sale.categories.length)
        t.deepEqual(typeof (info.sale.potd), 'boolean')

        t.true(this.validateImage(info.brand.logo))
        t.truthy(info.brand.name)
        t.truthy(info.brand.description)

        t.truthy(info.title)
        t.deepEqual(typeof (info.returnDays), 'number')

        if (info.returnable) {
            t.deepEqual(typeof (info.returnable), 'boolean')
        }

        t.truthy(info.description.heading)

        info.description.secondary.forEach(item => {
            t.true(item.hasOwnProperty('header'))
            t.truthy(item.data)
        })

        for (const [key, value] of Object.entries(info.images)) {
            value.forEach(value => {
                this.validateImage(value)
            })
        }

        for (let product of info.products) {
            t.true(Object.keys(info.images).includes(product.imageKey))
            this.validateProductItem(t, product)
        }

        t.truthy(info.sizes)
        t.truthy(info.colors)
    }

    public validateSaleInfo(t: ExecutionContext, res: Model.SaleInfoModel) {
        t.truthy(res.title)
        t.true(new Date(res.startTime).getTime() < new Date().getTime())

        res.products.forEach(product => {
            t.truthy(product.id)
            t.truthy(product.title)
            t.true(this.validateImage(product.image))
            t.true(this.validateImage(product.image2))
            t.true(product.retailPrice >= product.salePrice)
            t.deepEqual(typeof (product.soldOut), 'boolean')
            t.truthy.skip(product.category)
            t.truthy(product.brand)
            t.true(product.slug.includes(product.id))
            t.deepEqual(typeof (product.quantity), 'number')
            t.true(product.numberOfVariations >= 0)
            t.truthy(product.nsId)
            t.false(product.isSecretSale)
        })

        t.truthy(res.filter.gender)
        t.truthy(res.filter.type)
        t.truthy(res.filter.color)
        t.truthy(res.filter.size)
        t.truthy(res.filter.brand)
        t.truthy(res.filter.category)

        t.true(res.sort.includes('RECOMMENDED'))
        t.true(res.sort.includes('HIGHEST_DISCOUNT'))
        t.true(res.sort.includes('LOW_PRICE'))
        t.true(res.sort.includes('HIGH_PRICE'))

        t.false(res.campaign)
        t.true(res.slug.includes(res.id))
    }

    public validateSaleList(t: ExecutionContext, sale: Model.SalesModel) {
        t.truthy(sale.id)
        t.truthy(sale.title)
        t.truthy(sale.endTime)

        if (sale.image) {
            t.true(this.validateImage(sale.image))
        }
        if (sale.image1) {
            t.true(this.validateImage(sale.image1))
        }
        if (sale.image2) {
            t.true(this.validateImage(sale.image2))
        }
        if (sale.image3) {
            t.true(this.validateImage(sale.image3))
        }
        if (sale.image4) {
            t.true(this.validateImage(sale.image4))
        }

        if (sale.categories) {
            t.truthy(sale.categories.length)
        }

        if (sale.potd === false) {
            t.true(sale.slug.includes(sale.id))
        } else if (sale.potd === true) {
            t.false(sale.slug.includes(sale.id))
        }

        t.deepEqual(typeof (sale.international), 'boolean')
    }
}