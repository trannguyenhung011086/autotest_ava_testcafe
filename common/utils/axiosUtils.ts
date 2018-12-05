import config from '../../config/config'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import querystring from 'querystring'

export default class AxiosUtils {

    public async post(api: string, data: Object, cookie?: string): Promise<AxiosResponse> {
        let options: AxiosRequestConfig = {
            baseURL: config.baseUrl,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true
            }
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        return await axios.post(encodeURI(api), data, options)
    }

    public async put(api: string, data: Object, cookie?: string): Promise<AxiosResponse> {
        let options: AxiosRequestConfig = {
            baseURL: config.baseUrl,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true
            }
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        return await axios.put(encodeURI(api), data, options)
    }

    public async delete(api: string, cookie?: string): Promise<AxiosResponse> {
        let options: AxiosRequestConfig = {
            baseURL: config.baseUrl,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true
            }
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        return await axios.delete(encodeURI(api), options)
    }

    public async get(api: string, cookie?: string): Promise<AxiosResponse> {
        let options: AxiosRequestConfig = {
            baseURL: config.baseUrl,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            },
            validateStatus: (status) => {
                return true
            }
        }
        if (cookie) {
            options.headers['Cookie'] = cookie
        }
        return await axios.get(encodeURI(api), options)
    }

    public async postFormUrl(base: string, api: string, data: Object, cookie?: string): Promise<AxiosResponse> {
        let options: AxiosRequestConfig = {
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