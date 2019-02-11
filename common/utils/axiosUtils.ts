import { config } from '../../config'
import axios, { AxiosResponse } from 'axios'
import qs from 'qs'
import axiosCookieJarSupport from 'axios-cookiejar-support'
import tough from 'tough-cookie'

export class AxiosUtils {
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
            delete options.jar
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
            delete options.jar
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
            delete options.jar
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
            delete options.jar
        }
        if (base) {
            options.baseURL = base
        }
        return await axios.get(encodeURI(api), options)
    }

    public async postFormUrl(api: string, data: Object, cookie?: string, base?: string): Promise<AxiosResponse> {
        let options = {
            method: 'POST',
            baseURL: config.baseUrl,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            jar: this.cookieJar
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
            delete options.jar
        }
        if (base) {
            options.baseURL = base
        }
        return await axios.post(encodeURI(api), qs.stringify(data, { encodeValuesOnly: true }), options)
            .catch(err => {
                console.log(err)
                return err
            })
    }
}