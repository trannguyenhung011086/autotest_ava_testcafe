import { config } from '../../config'
import got, { GotJSONOptions } from 'got'
import { CookieJar } from 'tough-cookie'

export class GotUtils {
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
        let options = {
            baseUrl: config.baseUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data,
            throwHttpErrors: false,
            form: true,
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
}