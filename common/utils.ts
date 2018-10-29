import config from '../config/config'
import axios, { AxiosRequestConfig } from 'axios'

export class Utils {
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

    public async getLogInCookie() {
        const settings = this.settings
        const data: Object = {
            email: config.testAccount.email,
            password: config.testAccount.password
        }
        var cookie: string = await axios.post(config.api.login, data, settings)
            .then(response => response.headers['set-cookie'][0])
        return cookie
    }

    public async post(api: string, data: Object, cookie: string = null) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.post(api, data, settings)
    }

    public async put(api: string, data: Object, cookie: string = null) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.put(api, data, settings)
    }

    public async get(api: string, cookie: string = null) {
        if (cookie) {
            this.settings.headers['Cookie'] = cookie
        }
        const settings = this.settings
        return await axios.get(api, settings)
    }
}