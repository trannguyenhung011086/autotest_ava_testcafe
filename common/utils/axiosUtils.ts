import config from '../../config/config'
import axios, { AxiosRequestConfig } from 'axios'

export default class AxiosUtils {
    public settings: AxiosRequestConfig = {
        baseURL: config.baseUrl,
        withCredentials: true,
        headers: {
            'Content-type': 'application/json'
        },
        validateStatus: (status) => {
            return true
        }
    }

    public async post(api: string, data: Object, cookie?: string) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.post(encodeURI(api), data, settings)
    }

    public async put(api: string, data: Object, cookie?: string) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.put(encodeURI(api), data, settings)
    }

    public async delete(api: string, cookie?: string) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.delete(encodeURI(api), settings)
    }

    public async get(api: string, cookie?: string) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.get(encodeURI(api), settings)
    }
}