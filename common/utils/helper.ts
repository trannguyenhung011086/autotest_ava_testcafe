import { config } from '../config'
import * as got from 'got'
import { GotJSONOptions } from 'got'
import { CookieJar } from 'tough-cookie'

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

    public getArrayRandomElement(arr: any[]) {
        if (arr && arr.length) {
            return arr[Math.floor(Math.random() * arr.length)]
        }
    }

    public matchRegExp(input: string, exp: RegExp) {
        const matched = input.match(exp)

        if (matched.length > 0) {
            return true
        } else {
            return false
        }
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
}