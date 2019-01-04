import config from '../../config/config'
import axios, { AxiosResponse } from 'axios'
import * as querystring from 'querystring'
import axiosCookieJarSupport from 'axios-cookiejar-support'
import * as tough from 'tough-cookie'

export default class AxiosUtils {
    constructor() {
        axiosCookieJarSupport(axios)
    }

    public cookieJar = new tough.CookieJar()

    public async post(api: string, data: Object, cookie?: string, base?: string): Promise<AxiosResponse> {
        let options = {
            baseURL: config.baseUrl,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true
            },
            jar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
            options.withCredentials = false
        }
        if (base) {
            options.baseURL = base
        }
        return await axios.post(encodeURI(api), data, options)
    }

    public async put(api: string, data: Object, cookie?: string, base?: string): Promise<AxiosResponse> {
        let options = {
            baseURL: config.baseUrl,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true
            },
            jar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
            options.withCredentials = false
        }
        if (base) {
            options.baseURL = base
        }
        return await axios.put(encodeURI(api), data, options)
    }

    public async delete(api: string, cookie?: string, base?: string): Promise<AxiosResponse> {
        let options = {
            baseURL: config.baseUrl,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true
            },
            jar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
            options.withCredentials = false
        }
        if (base) {
            options.baseURL = base
        }
        return await axios.delete(encodeURI(api), options)
    }

    public async get(api: string, cookie?: string, base?: string): Promise<AxiosResponse> {
        let options = {
            baseURL: config.baseUrl,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true
            },
            jar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
            options.withCredentials = false
        }
        if (base) {
            options.baseURL = base
        }
        return await axios.get(encodeURI(api), options)
    }

    public async postFormUrl(base: string, api: string, data: Object, cookie?: string): Promise<AxiosResponse> {
        let options = {
            baseURL: base,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            validateStatus: (status) => {
                return true
            }
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        return await axios.post(encodeURI(api), querystring.stringify(data), options)
    }
}